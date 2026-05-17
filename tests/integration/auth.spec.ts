import createApp from "#/app.js";
import { Application } from "express";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";
import request from "supertest";
import { expect } from "chai";
import { FOUND, OK } from "#/lib/constants/httpStatus.js";
import config from "#/config.js";
import { SessionData } from "express-session";
import type { RedisClientType } from "#/types/redis-types.js";

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
  config.entra.authority = `http://localhost:${identityProviderContainer.getMappedPort(IDP_PORT)}/default`;
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
    // Start Redis and IdP containers in parallel
    [redisContainer, idpContainer] = await Promise.all([
      new GenericContainer("redis:7-alpine")
        .withExposedPorts(REDIS_PORT)
        .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
        .start(),

      new GenericContainer("ghcr.io/navikt/mock-oauth2-server:3.0.1")
        .withExposedPorts(IDP_PORT)
        .withWaitStrategy(
          Wait.forHttp("/default/.well-known/openid-configuration", IDP_PORT),
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
    const closeAppSessionRedisClient =
      appSessionRedisClient?.isOpen === true
        ? appSessionRedisClient.quit()
        : Promise.resolve();

    await Promise.all([
      closeAppSessionRedisClient,
      redisContainer?.stop() ?? Promise.resolve(),
      idpContainer?.stop() ?? Promise.resolve(),
    ]);
  });

  beforeEach(async () => {
    authenticatedUser = request.agent(app);
    await authenticatedUser.get("/test/signin");
    await authenticatedUser.get("/__test/session-store-client");
    unauthenticatedUser = request.agent(app);
  });

  afterEach(async () => {
    if (appSessionRedisClient?.isOpen === true) {
      await appSessionRedisClient.flushAll();
    }
  });

  describe("GET /health", () => {
    it("returns healthy without auth", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(OK);
      expect(res.text).to.equal("Healthy");
    });
  });

  describe("Get /landing", () => {
    it("redirects unauthenicated user to /auth/signin", async () => {
      const res = await unauthenticatedUser.get("/landing");
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/auth/signin");
    });

    it("authenicated user lands on landing page", async () => {
      const res = await authenticatedUser.get("/landing");
      expect(res.status).to.equal(OK);
      expect(res.text).to.include("Stub Landing Page");
    });

    it("authenicated user will store session data in redis", async () => {
      await authenticatedUser.get("/landing");
      const keys = await appSessionRedisClient.keys("sess:*");
      const raw = await appSessionRedisClient.get(keys[0]);
      const session = JSON.parse(raw!) as SessionData;
      expect(session.isAuthenticated).to.equal(true);
      expect(session.account?.homeAccountId).to.equal(
        "test-uid.test-tenant-id",
      );
    });
  });
});
