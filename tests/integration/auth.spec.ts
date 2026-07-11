import createApp from "#/app.js";
import { Application } from "express";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";
import request from "supertest";
import { expect } from "chai";
import config from "#/config.js";
import { SessionData } from "express-session";
import { Agent, request as undiciRequest, setGlobalDispatcher } from "undici";
import { RedisClientType } from "redis";
import { FOUND, OK } from "#/lib/constants/http.js";

const REDIS_PORT = 6379;
const IDP_PORT = 8080;

let redisContainer: StartedTestContainer;
let idpContainer: StartedTestContainer;
let app: Application;
let authenticatedUser: ReturnType<typeof request.agent>;
let unauthenticatedUser: ReturnType<typeof request.agent>;
let appSessionRedisClient: RedisClientType;

const createAppWithSessionStoreClientExposure = async (
  identityProviderContainer: StartedTestContainer,
  redisStoreContainer: StartedTestContainer,
): Promise<Application> => {

  // Override config to point to testcontainers instances
  const idpPort = identityProviderContainer.getMappedPort(IDP_PORT);
  config.entra.authority = `https://localhost:${idpPort}/default`;
  config.entra.redirectUri = "http://127.0.0.1/auth/code/callback";
  config.redis.enabled = true;
  config.redis.url = `redis://localhost:${redisStoreContainer.getMappedPort(REDIS_PORT)}`;
  process.env.PLAYWRIGHT_TEST_SIGNIN = "true";

  const app = await createApp();

  // Expose an endpoint to retrieve the session store's Redis client for testing purposes
  app.get("/__test/session-store-client", (req, res) => {
    if (!("client" in req.sessionStore)) {
      throw new Error("Expected connect-redis session store in integration test");
    }

    appSessionRedisClient = req.sessionStore.client as RedisClientType;
    res.status(OK).send("ok");
  });

  return app;
};


describe("Auth Integration", () => {
  before(async () => {
    // MSAL Node uses native fetch (backed by undici). setGlobalDispatcher patches
    // undici's default dispatcher so fetch accepts the mock IdP's self-signed TLS cert.
    setGlobalDispatcher(new Agent({ connect: { rejectUnauthorized: false } }));

    // Start Redis and IdP containers in parallel
    [redisContainer, idpContainer] = await Promise.all([
      new GenericContainer("redis:7-alpine")
        .withExposedPorts(REDIS_PORT)
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .start(),

      new GenericContainer("ghcr.io/navikt/mock-oauth2-server:3.0.1")
        .withExposedPorts(IDP_PORT)
        .withEnvironment({
          JSON_CONFIG: JSON.stringify({
            interactiveLogin: true,
            httpServer: { type: "NettyWrapper", ssl: {} },
          }),
        })
        .withWaitStrategy(
          Wait.forHttp("/isalive", IDP_PORT).usingTls().allowInsecure(),
        )
        .start(),
    ]);

    // Create app instance and reuse its session store Redis client
    app = await createAppWithSessionStoreClientExposure(
      idpContainer,
      redisContainer,
    );
    
  });

  after(async () => {
    await Promise.all([
      appSessionRedisClient.quit(),
      redisContainer?.stop(),
      idpContainer?.stop()
    ]);
  });

  beforeEach(async () => {
    authenticatedUser = request.agent(app);
    await authenticatedUser.get("/test/signin");
    await authenticatedUser.get("/__test/session-store-client");
    unauthenticatedUser = request.agent(app);
  });

  afterEach(async () => {
    await appSessionRedisClient.flushAll();
  });

  describe("GET /health", () => {
    it("returns healthy without auth", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(OK);
      expect(res.text).to.equal("Healthy");
    });
  });

  describe("Get /", () => {
    it("redirects unauthenicated user to /auth/signin", async () => {
      const res = await unauthenticatedUser.get("/");
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/auth/signin");
    });

    it("authenicated user lands on landing page", async () => {
      const res = await authenticatedUser.get("/");
      expect(res.status).to.equal(OK);
      expect(res.text).to.include("Landing Page");
    });

    it("authenicated user will store session data in redis", async () => {
      await authenticatedUser.get("/");
      const keys = await appSessionRedisClient.keys("sess:*");
      const raw = await appSessionRedisClient.get(keys[0]);
      const session = JSON.parse(raw!) as SessionData;
      expect(session.isAuthenticated).to.equal(true);
      expect(session.account?.homeAccountId).to.equal(
        "test-uid.test-tenant-id",
      );
    });
  });

  describe("OAuth2 Authorization Code Flow", () => {
    it("unauthenticated user can complete full login flow via mock IdP", async () => {

      const signinRes = await unauthenticatedUser.get("/auth/signin");
      expect(signinRes.status).to.equal(FOUND);

      // Extract the authorize URL from the redirect to send the next request to the IdP
      const authorizeUrl = signinRes.headers.location as string;

      // Bypass the mock server's login form by POSTing directly to the
      // authorize endpoint with a username.
      const postBody = new URLSearchParams({ username: "testuser" }).toString();
      const idpResponse = await undiciRequest(authorizeUrl, {
        method: "POST",
        body: postBody,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
 
      // The mock server redirects to our app's callback with code & state.
      // Extract the path+query so we can send it to the app via supertest
      const { pathname, search } = new URL(idpResponse.headers.location as string);
    
      // Complete the OAuth2 callback by sending the code and state to callback endpoint
      const callbackRes = await unauthenticatedUser.get(pathname + search);
      expect(callbackRes.status).to.equal(FOUND);
      expect(callbackRes.headers.location).to.equal("/");

      // Verify the user is now authenticated and can reach the landing page
      const landingRes = await unauthenticatedUser.get("/");
      expect(landingRes.status).to.equal(OK);
      expect(landingRes.text).to.include("Landing Page");
    });
  });
});
