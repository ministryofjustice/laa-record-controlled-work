import createApp from "#/app.js";
import { Application } from "express";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";
import request from "supertest";
import { expect } from "chai";
import { authRequestDefaults, msalConfig } from "#/auth/auth.config.js";
import config from "#/config.js";
import { SessionData } from "express-session";
import { Agent, request as undiciRequest, setGlobalDispatcher } from "undici";
import type { RedisClientType } from "redis";
import { createClient } from "redis";
import { createRedisClient as createAppRedisClient } from "#/lib/redis.js";
import { FOUND, OK } from "#/lib/constants/http.js";
import { createAuthFlowStore } from "#/auth/auth.flow-store.js";
import type { Either } from "#/lib/either.js";

const REDIS_PORT = 6379;
const IDP_PORT = 8080;

type MockMsalMetadata = {
  authorityMetadata: string;
  cloudDiscoveryMetadata: string;
};

type MutableAuthRequestDefaults = {
  redirectUri: string;
};

type MutableMsalConfig = {
  auth: {
    authority: string;
    authorityMetadata?: string;
    clientId: string;
    clientSecret: string;
    cloudDiscoveryMetadata?: string;
  };
};

type MsalOriginalValues = {
  authority: string;
  authorityMetadata?: string;
  cloudDiscoveryMetadata?: string;
  redirectUri: string;
};

function getValue<Err, Value>(result: Either<Err, Value>): Value {
  if ("error" in result) throw result.error;
  return result.value;
}

function buildMockIdpMsalMetadata(authority: string): MockMsalMetadata {
  const authorityUrl = new URL(authority);
  const hostWithPort = authorityUrl.host;
  const normalizedAuthority = authority.replace(/\/+$/, "");

  return {
    authorityMetadata: JSON.stringify({
      authorization_endpoint: `${normalizedAuthority}/oauth2/v2.0/authorize`,
      code_challenge_methods_supported: ["S256"],
      end_session_endpoint: `${normalizedAuthority}/oauth2/v2.0/logout`,
      id_token_signing_alg_values_supported: ["RS256"],
      issuer: `${normalizedAuthority}/v2.0`,
      jwks_uri: `${normalizedAuthority}/discovery/v2.0/keys`,
      response_modes_supported: ["query"],
      response_types_supported: ["code"],
      subject_types_supported: ["pairwise"],
      token_endpoint: `${normalizedAuthority}/oauth2/v2.0/token`,
    }),
    cloudDiscoveryMetadata: JSON.stringify({
      metadata: [
        {
          aliases: [hostWithPort],
          preferred_cache: hostWithPort,
          preferred_network: hostWithPort,
        },
      ],
      tenant_discovery_endpoint: `${normalizedAuthority}/v2.0/.well-known/openid-configuration`,
    }),
  };
}

let redisContainer: StartedTestContainer;
let idpContainer: StartedTestContainer;
let app: Application;
let authenticatedUser: ReturnType<typeof request.agent>;
let unauthenticatedUser: ReturnType<typeof request.agent>;
let sessionRedisClient: RedisClientType;
let msalOriginalValues: MsalOriginalValues;

describe("Auth Integration", () => {
  before(async function () {
    this.timeout(300_000); // containers may need to pull images on first run
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

    const idpPort = idpContainer.getMappedPort(IDP_PORT);
    const redisUrl = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}`;
    const mutableMsalConfig = msalConfig as unknown as MutableMsalConfig;
    const mutableAuthRequestDefaults =
      authRequestDefaults as unknown as MutableAuthRequestDefaults;

    config.entra.authority = `https://localhost:${idpPort}/default`;
    config.entra.redirectUri = "http://127.0.0.1/auth/code/callback";
    const { authorityMetadata, cloudDiscoveryMetadata } =
      buildMockIdpMsalMetadata(config.entra.authority);

    msalOriginalValues = {
      authority: mutableMsalConfig.auth.authority,
      authorityMetadata: mutableMsalConfig.auth.authorityMetadata,
      cloudDiscoveryMetadata: mutableMsalConfig.auth.cloudDiscoveryMetadata,
      redirectUri: mutableAuthRequestDefaults.redirectUri,
    };

    mutableMsalConfig.auth.authority = config.entra.authority;
    mutableMsalConfig.auth.authorityMetadata = authorityMetadata;
    mutableMsalConfig.auth.cloudDiscoveryMetadata = cloudDiscoveryMetadata;
    mutableAuthRequestDefaults.redirectUri = config.entra.redirectUri;

    config.redis.enabled = true;
    config.redis.url = redisUrl;
    process.env.PLAYWRIGHT_TEST_SIGNIN = "true";

    app = await createApp({
      getRedisClient: () => {
        sessionRedisClient = createAppRedisClient(config.redis);
        return sessionRedisClient;
      },
    });
  });

  after(async () => {
    const mutableMsalConfig = msalConfig as unknown as MutableMsalConfig;
    const mutableAuthRequestDefaults =
      authRequestDefaults as unknown as MutableAuthRequestDefaults;

    mutableMsalConfig.auth.authority = msalOriginalValues.authority;
    mutableMsalConfig.auth.authorityMetadata =
      msalOriginalValues.authorityMetadata;
    mutableMsalConfig.auth.cloudDiscoveryMetadata =
      msalOriginalValues.cloudDiscoveryMetadata;
    mutableAuthRequestDefaults.redirectUri = msalOriginalValues.redirectUri;

    if (sessionRedisClient.isOpen) {
      await sessionRedisClient.quit();
    }

    await Promise.all([redisContainer?.stop(), idpContainer?.stop()]);
  });

  beforeEach(async () => {
    authenticatedUser = request.agent(app);
    await authenticatedUser.get("/test/signin");
    unauthenticatedUser = request.agent(app);
  });

  afterEach(async () => {
    await sessionRedisClient.flushAll();
  });

  describe("GET /health", () => {
    it("returns healthy without auth", async () => {
      const res = await request(app).get("/health");
      expect(res.status).to.equal(OK);
      expect(res.text).to.equal("Healthy");
    });
  });

  describe("Get /", () => {
    it("redirects unauthenticated user to /auth/signin", async () => {
      const res = await unauthenticatedUser.get("/");
      expect(res.status).to.equal(FOUND);
      expect(res.headers.location).to.equal("/auth/signin");
    });

    it("authenticated user lands on landing page", async () => {
      const res = await authenticatedUser.get("/");
      expect(res.status).to.equal(OK);
      expect(res.text).to.include("Landing Page");
    });

    it("authenticated user will store session data in redis", async () => {
      await authenticatedUser.get("/");
      const keys = await sessionRedisClient.keys("sess:*");
      const raw = await sessionRedisClient.get(keys[0]);
      const session = JSON.parse(raw!) as SessionData;
      expect(session.isAuthenticated).to.equal(true);
      expect(session.account?.homeAccountId).to.equal("test.user@example.com");
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
      const location = idpResponse.headers.location;
      const callbackLocation = Array.isArray(location) ? location[0] : location;
      expect(callbackLocation, "IdP response location header").to.be.a(
        "string",
      );
      const { pathname, search } = new URL(
        callbackLocation as string,
        config.entra.redirectUri,
      );

      // Complete the OAuth2 callback by sending the code and state to callback endpoint
      const callbackRes = await unauthenticatedUser.get(pathname + search);
      expect(callbackRes.status).to.equal(FOUND);
      expect(callbackRes.headers.location).to.equal("/");

      // Mimic office selection, which is not handled by the mock IdP. Without this, auth will fail.
      await unauthenticatedUser.get("/test/select-office");

      // Verify the user is now authenticated and can reach the landing page
      const landingRes = await unauthenticatedUser.get("/");
      expect(landingRes.status).to.equal(OK);
      expect(landingRes.text).to.include("Landing Page");
    });
  });

  describe("Distributed auth flow storage", () => {
    it("keeps only the latest reservation across independent Redis clients", async () => {
      const clients = [
        createClient({ url: config.redis.url }),
        createClient({ url: config.redis.url }),
      ];
      await Promise.all(clients.map((client) => client.connect()));

      try {
        const [firstClient, secondClient] = clients;
        const firstStore = createAuthFlowStore({ redisClient: firstClient });
        const secondStore = createAuthFlowStore({ redisClient: secondClient });
        const sessionId = `distributed-${crypto.randomUUID()}`;
        const first = await firstStore.reserve(sessionId);
        const second = await secondStore.reserve(sessionId);
        if (first.error || second.error) {
          throw first.error ?? second.error;
        }

        const latestFlow = {
          authCodeRequest: {
            code: "",
            codeVerifier: "new-verifier",
            redirectUri: config.entra.redirectUri,
            scopes: ["scope.read"],
          },
          authState: "latest-state",
          returnTo: "/cases/latest",
        };
        const olderFlow = {
          ...latestFlow,
          authState: "older-state",
          returnTo: "/cases/older",
        };
        const [latestPublish, stalePublish] = await Promise.all([
          secondStore.publish(
            sessionId,
            second.value.reservationId,
            latestFlow,
          ),
          firstStore.publish(
            sessionId,
            first.value.reservationId,
            olderFlow,
          ),
        ]);
        if (latestPublish.error || stalePublish.error) {
          throw latestPublish.error ?? stalePublish.error;
        }

        const mismatch = await firstStore.consume(sessionId, "older-state");
        const callbacks = await Promise.all([
          firstStore.consume(sessionId, "latest-state"),
          secondStore.consume(sessionId, "latest-state"),
        ]);
        if (mismatch.error || callbacks.some((result) => result.error)) {
          throw mismatch.error ?? callbacks.find((result) => result.error)?.error;
        }
        const callbackValues = callbacks.map(getValue);
        const consumed = callbackValues.filter((flow) => flow !== undefined);
        const replay = await secondStore.consume(sessionId, "latest-state");

        expect(getValue(latestPublish)).to.be.true;
        expect(getValue(stalePublish)).to.be.false;
        expect(getValue(mismatch)).to.be.undefined;
        expect(consumed).to.have.length(1);
        expect(consumed[0]).to.deep.equal(latestFlow);
        expect(getValue(replay)).to.be.undefined;
      } finally {
        await Promise.all(clients.map((client) => client.quit()));
      }
    });

    it("does not allow another initiating session to consume a flow", async () => {
      const client = createClient({ url: config.redis.url });
      await client.connect();

      try {
        const store = createAuthFlowStore({ redisClient: client });
        const reservation = await store.reserve("session-one");
        if (reservation.error) throw reservation.error;
        const flow = {
          authCodeRequest: {
            code: "",
            codeVerifier: "verifier",
            redirectUri: config.entra.redirectUri,
            scopes: ["scope.read"],
          },
          authState: "session-bound-state",
          returnTo: "/",
        };
        const published = await store.publish(
          "session-one",
          reservation.value.reservationId,
          flow,
        );
        if (published.error) throw published.error;

        const substituted = await store.consume(
          "session-two",
          flow.authState,
        );
        const rightful = await store.consume("session-one", flow.authState);

        expect(getValue(published)).to.be.true;
        expect(getValue(substituted)).to.be.undefined;
        expect(getValue(rightful)).to.deep.equal(flow);
      } finally {
        await client.quit();
      }
    });
  });
});
