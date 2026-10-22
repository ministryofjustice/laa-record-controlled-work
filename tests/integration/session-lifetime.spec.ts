import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import session from "express-session";
import { RedisStore } from "connect-redis";
import { createClient } from "redis";
import type { RedisClientType } from "redis";
import request from "supertest";

import { expect } from "chai";
import sinon from "sinon";
import type { SinonFakeTimers } from "sinon";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";

import { createEligibilityRouter } from "#/api/eligibility/eligibility.routes.js";
import { requireAuth } from "#/auth/middleware/requireAuth.middleware.js";
import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import { setLifecycle } from "#/auth/session.lifecycle.js";
import config from "#/config.js";
import * as redis from "#/lib/redis.js";
import { FOUND, OK } from "#/lib/constants/http.js";
import { HOUR, MINUTE } from "#/lib/constants/time.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const REDIS_PORT = 6379;
const APPLICATION_ID = "123e4567-e89b-12d3-a456-426614174000";
const SESSION_IDLE_TIMEOUT = 30 * MINUTE;
const SESSION_ABSOLUTE_TIMEOUT = 12 * HOUR;
const SESSION_ACTIVITY_INTERVAL = 25 * MINUTE;
const SESSION_ABSOLUTE_EXPIRY_MARGIN = 10 * MINUTE;

let redisContainer: StartedTestContainer;
let firstRedisClient: RedisClientType;
let secondRedisClient: RedisClientType;
let cacheRedisClient: RedisClientType;
let originalRedisEnabled: boolean;
let originalRedisUrl: string;

function getSessionCookieHeader(
  value: string | string[] | undefined,
): string | undefined {
  const cookies =
    value === undefined ? [] : Array.isArray(value) ? value : [value];
  return cookies.find((cookie) => cookie.startsWith(`${config.session.name}=`));
}

function getSessionCookie(
  value: string | string[] | undefined,
): string | undefined {
  return getSessionCookieHeader(value)?.split(";", 1)[0];
}

function buildApp(
  client: RedisClientType,
  getApplication: sinon.SinonStub,
  updateApplicationMeans: sinon.SinonStub,
): Application {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      ...config.session,
      store: new RedisStore({ client }),
    }),
  );
  app.get("/test/signin", (req: Request, res: Response, next) => {
    const now = Date.now();
    Object.assign(req.session, {
      account: {
        homeAccountId: "synthetic-session-user",
        idToken: "synthetic-id-token",
        idTokenClaims: {
          LAA_ACCOUNTS: ["OFFICE-1"],
          exp: Math.floor((now + 24 * HOUR) / 1000),
        },
      },
      isAuthenticated: true,
      msal: { homeAccountId: "synthetic-session-user" },
      selectedOffice: { address: "1 Example Street", code: "OFFICE-1" },
    });
    setLifecycle(req.session, now);
    req.session.save((error) => {
      if (error) {
        next(error);
        return;
      }
      res.set("x-test-session-id", req.sessionID).sendStatus(OK);
    });
  });
  app.use(
    `/api/applications/:applicationId/eligibility`,
    requireAuth(),
    createEligibilityRouter({ getApplication, updateApplicationMeans }),
  );
  return app;
}

function buildEligibilityDependencies(): {
  getApplication: sinon.SinonStub;
  updateApplicationMeans: sinon.SinonStub;
} {
  const getApplication = sinon.stub().resolves({
    data: getGetApplicationResponseMock({
      id: APPLICATION_ID,
      clientDetails: {
        ...getGetApplicationResponseMock().clientDetails,
        dateOfBirth: "1990-01-01",
      },
      eligibility: null,
    }),
    status: 200,
  });
  const updateApplicationMeans = sinon.stub().resolves({
    data: undefined,
    status: 204,
  });
  return { getApplication, updateApplicationMeans };
}

async function createAuthenticatedSession(
  app: Application,
): Promise<{ cookie: string; sessionId: string }> {
  const response = await request(app).get("/test/signin");
  const cookie = getSessionCookie(response.headers["set-cookie"]);
  const sessionId = response.headers["x-test-session-id"];

  expect(response.status).to.equal(OK);
  expect(cookie).to.be.a("string");
  expect(sessionId).to.be.a("string");

  return { cookie: cookie!, sessionId: sessionId as string };
}

async function createAuthenticatedSessionWithCache(
  app: Application,
): Promise<{ cookie: string; msalCacheKey: string; sessionId: string }> {
  const { cookie, sessionId } = await createAuthenticatedSession(app);
  const msalCacheKey = getMsalCacheKey(sessionId);
  await firstRedisClient.set(msalCacheKey, "synthetic-cache", {
    EX: config.redis.maxAge,
  });

  return { cookie, msalCacheKey, sessionId };
}

async function getLastActivityAt(
  sessionId: string,
): Promise<number | undefined> {
  const storedSession = await firstRedisClient.get(`sess:${sessionId}`);
  if (storedSession === null) return;

  return (JSON.parse(storedSession) as { lastActivityAt?: number })
    .lastActivityAt;
}

async function keepSessionActiveUntil(
  clock: SinonFakeTimers,
  app: Application,
  cookie: string,
  authenticatedAt: number,
  targetElapsed: number,
): Promise<void> {
  for (
    let elapsed = SESSION_ACTIVITY_INTERVAL;
    elapsed < targetElapsed;
    elapsed += SESSION_ACTIVITY_INTERVAL
  ) {
    clock.setSystemTime(authenticatedAt + elapsed);
    const response = await request(app)
      .get(`/api/applications/${APPLICATION_ID}/eligibility`)
      .set("Cookie", cookie);
    expect(response.status).to.equal(OK);
  }
}

describe("Authenticated session lifetimes with Redis", () => {
  before(async function () {
    this.timeout(300_000);
    originalRedisEnabled = config.redis.enabled;
    originalRedisUrl = config.redis.url;
    redisContainer = await new GenericContainer("redis:7-alpine")
      .withExposedPorts(REDIS_PORT)
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start();

    const redisUrl = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}`;
    firstRedisClient = createClient({ url: redisUrl });
    secondRedisClient = createClient({ url: redisUrl });
    await Promise.all([
      firstRedisClient.connect(),
      secondRedisClient.connect(),
    ]);
    config.redis.url = redisUrl;
    config.redis.enabled = true;
  });

  after(async () => {
    try {
      await Promise.all(
        [firstRedisClient, secondRedisClient].map(async (client) => {
          if (client?.isOpen) await client.quit();
        }),
      );
    } finally {
      config.redis.enabled = originalRedisEnabled;
      config.redis.url = originalRedisUrl;
      await redisContainer?.stop();
    }
  });

  afterEach(async () => {
    sinon.restore();
    await firstRedisClient.flushDb();
    if (cacheRedisClient?.isOpen) await cacheRedisClient.quit();
  });

  beforeEach(async () => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    cacheRedisClient = redis.createRedisClient(config.redis);
    await cacheRedisClient.connect();
  });

  describe("CCQ eligibility activity", () => {
    let clock: SinonFakeTimers;
    let dependencies: {
      getApplication: sinon.SinonStub;
      updateApplicationMeans: sinon.SinonStub;
    };
    let firstApp: Application;
    let secondApp: Application;

    beforeEach(() => {
      clock = sinon.useFakeTimers({ now: Date.now(), toFake: ["Date"] });
      dependencies = buildEligibilityDependencies();
      firstApp = buildApp(
        firstRedisClient,
        dependencies.getApplication,
        dependencies.updateApplicationMeans,
      );
      secondApp = buildApp(
        secondRedisClient,
        dependencies.getApplication,
        dependencies.updateApplicationMeans,
      );
    });

    it("renews activity from GET requests across replicas", async () => {
      const { cookie, msalCacheKey, sessionId } =
        await createAuthenticatedSessionWithCache(firstApp);
      clock.setSystemTime(clock.now + 20 * MINUTE);

      const response = await request(secondApp)
        .get(`/api/applications/${APPLICATION_ID}/eligibility`)
        .set("Cookie", cookie);

      expect(response.status).to.equal(OK);
      expect(getSessionCookie(response.headers["set-cookie"])).to.be.a(
        "string",
      );
      expect(await getLastActivityAt(sessionId)).to.equal(clock.now);
      expect(await firstRedisClient.pExpireTime(msalCacheKey)).to.equal(
        clock.now + SESSION_IDLE_TIMEOUT,
      );
    });

    it("renews activity from PUT requests", async () => {
      const { cookie, msalCacheKey, sessionId } =
        await createAuthenticatedSessionWithCache(firstApp);
      clock.setSystemTime(clock.now + 20 * MINUTE);

      const response = await request(firstApp)
        .put(`/api/applications/${APPLICATION_ID}/eligibility`)
        .set("Cookie", cookie)
        .send({
          eligibility_assessment: {
            api_response: { indication: true },
            level_of_help: "controlled_legal_representation",
          },
        });

      expect(response.status).to.equal(OK);
      expect(dependencies.updateApplicationMeans.calledOnce).to.be.true;
      expect(await getLastActivityAt(sessionId)).to.equal(clock.now);
      expect(await firstRedisClient.pExpireTime(msalCacheKey)).to.equal(
        clock.now + SESSION_IDLE_TIMEOUT,
      );
    });

    it("rejects an idle session and clears its session and cache", async () => {
      const { cookie, msalCacheKey, sessionId } =
        await createAuthenticatedSessionWithCache(firstApp);
      clock.setSystemTime(clock.now + SESSION_IDLE_TIMEOUT + 1);

      const response = await request(secondApp)
        .get(`/api/applications/${APPLICATION_ID}/eligibility`)
        .set("Cookie", cookie);

      expect(response.status).to.equal(FOUND);
      expect(response.headers.location).to.equal("/auth/signin?prompt=login");
      expect(dependencies.getApplication.called).to.be.false;
      expect(await firstRedisClient.exists(`sess:${sessionId}`)).to.equal(0);
      expect(await firstRedisClient.exists(msalCacheKey)).to.equal(0);
    });
  });

  describe("absolute session deadline", () => {
    let authenticatedAt: number;
    let clock: SinonFakeTimers;
    let dependencies: {
      getApplication: sinon.SinonStub;
      updateApplicationMeans: sinon.SinonStub;
    };
    let app: Application;
    let cookie: string;
    let msalCacheKey: string;
    let sessionId: string;

    beforeEach(async () => {
      clock = sinon.useFakeTimers({ now: Date.now(), toFake: ["Date"] });
      authenticatedAt = clock.now;
      dependencies = buildEligibilityDependencies();
      app = buildApp(
        firstRedisClient,
        dependencies.getApplication,
        dependencies.updateApplicationMeans,
      );
      ({ cookie, msalCacheKey, sessionId } =
        await createAuthenticatedSessionWithCache(app));
      await keepSessionActiveUntil(
        clock,
        app,
        cookie,
        authenticatedAt,
        SESSION_ABSOLUTE_TIMEOUT - SESSION_ABSOLUTE_EXPIRY_MARGIN,
      );
    });

    it("caps cookie, session, and cache expiry at the absolute deadline", async () => {
      clock.setSystemTime(
        authenticatedAt +
          SESSION_ABSOLUTE_TIMEOUT -
          SESSION_ABSOLUTE_EXPIRY_MARGIN,
      );
      const response = await request(app)
        .get(`/api/applications/${APPLICATION_ID}/eligibility`)
        .set("Cookie", cookie);

      expect(response.status).to.equal(OK);
      expect(getSessionCookieHeader(response.headers["set-cookie"])).to.include(
        `Expires=${new Date(clock.now + SESSION_ABSOLUTE_EXPIRY_MARGIN).toUTCString()}`,
      );
      expect(await firstRedisClient.pExpireTime(msalCacheKey)).to.equal(
        clock.now + SESSION_ABSOLUTE_EXPIRY_MARGIN,
      );
      expect(await firstRedisClient.ttl(`sess:${sessionId}`)).to.be.within(
        599,
        600,
      );
    });

    it("rejects requests after the absolute deadline despite recent activity", async () => {
      clock.setSystemTime(authenticatedAt + SESSION_ABSOLUTE_TIMEOUT + 1);
      const response = await request(app)
        .put(`/api/applications/${APPLICATION_ID}/eligibility`)
        .set("Cookie", cookie)
        .send({
          eligibility_assessment: {
            api_response: { indication: true },
            level_of_help: "controlled_legal_representation",
          },
        });

      expect(response.status).to.equal(FOUND);
      expect(response.headers.location).to.equal("/auth/signin?prompt=login");
      expect(dependencies.updateApplicationMeans.called).to.be.false;
      expect(await firstRedisClient.exists(`sess:${sessionId}`)).to.equal(0);
      expect(await firstRedisClient.exists(msalCacheKey)).to.equal(0);
    });
  });
});
