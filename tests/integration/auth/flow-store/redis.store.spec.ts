import { randomUUID } from "node:crypto";

import { expect } from "chai";
import { createClient } from "redis";
import type { RedisClientType } from "redis";
import {
  GenericContainer,
  Wait,
  type StartedTestContainer,
} from "testcontainers";

import { createAuthFlowStore } from "#/auth/flow-store/flow-store.js";
import type { AuthFlow } from "#/auth/flow-store/flow-store.types.js";
import config from "#/config.js";
import type { Either } from "#/lib/either.js";

const REDIS_PORT = 6379;

let redisContainer: StartedTestContainer;
let redisUrl: string;
let originalRedisEnabled: boolean;

function getValue<Err, Value>(result: Either<Err, Value>): Value {
  if ("error" in result) throw result.error;
  return result.value;
}

async function withRedisClients<Value>(
  count: number,
  run: (clients: RedisClientType[]) => Promise<Value>,
): Promise<Value> {
  const clients = Array.from({ length: count }, () =>
    createClient({ url: redisUrl }),
  );

  try {
    await Promise.all(clients.map((client) => client.connect()));
    return await run(clients);
  } finally {
    await Promise.all(
      clients.map(async (client) => {
        if (!client.isOpen) return;
        try {
          await client.flushDb();
        } finally {
          await client.quit();
        }
      }),
    );
  }
}

describe("Redis auth flow store integration", () => {
  before(async function () {
    this.timeout(300_000);
    originalRedisEnabled = config.redis.enabled;
    redisContainer = await new GenericContainer("redis:7-alpine")
      .withExposedPorts(REDIS_PORT)
      .withWaitStrategy(Wait.forLogMessage("Ready to accept connections"))
      .start();
    redisUrl = `redis://localhost:${redisContainer.getMappedPort(REDIS_PORT)}`;
    config.redis.enabled = true;
  });

  after(async () => {
    try {
      await redisContainer?.stop();
    } finally {
      config.redis.enabled = originalRedisEnabled;
    }
  });

  it("keeps the latest reservation across clients and consumes it only once", async () => {
    await withRedisClients(2, async ([firstClient, secondClient]) => {
      if (!firstClient || !secondClient) {
        throw new Error("Expected two Redis clients");
      }

      const firstStore = createAuthFlowStore({ redisClient: firstClient });
      const secondStore = createAuthFlowStore({ redisClient: secondClient });
      const sessionId = `distributed-${randomUUID()}`;
      const first = getValue(await firstStore.reserve(sessionId));
      const second = getValue(await secondStore.reserve(sessionId));
      const latestFlow: AuthFlow = {
        authCodeRequest: {
          code: "",
          codeVerifier: "new-verifier",
          redirectUri: "http://localhost/auth/callback",
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
        secondStore.publish(sessionId, second.reservationId, latestFlow),
        firstStore.publish(sessionId, first.reservationId, olderFlow),
      ]);
      const mismatch = await firstStore.consume(sessionId, "older-state");
      const callbacks = await Promise.all([
        firstStore.consume(sessionId, "latest-state"),
        secondStore.consume(sessionId, "latest-state"),
      ]);
      const consumed = callbacks.map(getValue).filter((flow) => flow !== undefined);
      const replay = await secondStore.consume(sessionId, "latest-state");

      expect(getValue(latestPublish)).to.be.true;
      expect(getValue(stalePublish)).to.be.false;
      expect(getValue(mismatch)).to.be.undefined;
      expect(consumed).to.have.length(1);
      expect(consumed[0]).to.deep.equal(latestFlow);
      expect(getValue(replay)).to.be.undefined;
    });
  });

  it("does not allow another initiating session to consume a flow", async () => {
    await withRedisClients(1, async ([client]) => {
      if (!client) throw new Error("Expected a Redis client");

      const store = createAuthFlowStore({ redisClient: client });
      const initiatingSession = `session-one-${randomUUID()}`;
      const otherSession = `session-two-${randomUUID()}`;
      const reservation = getValue(await store.reserve(initiatingSession));
      const flow: AuthFlow = {
        authCodeRequest: {
          code: "",
          codeVerifier: "verifier",
          redirectUri: "http://localhost/auth/callback",
          scopes: ["scope.read"],
        },
        authState: "session-bound-state",
        returnTo: "/",
      };
      const published = await store.publish(
        initiatingSession,
        reservation.reservationId,
        flow,
      );
      const substituted = await store.consume(otherSession, flow.authState);
      const rightful = await store.consume(initiatingSession, flow.authState);

      expect(getValue(published)).to.be.true;
      expect(getValue(substituted)).to.be.undefined;
      expect(getValue(rightful)).to.deep.equal(flow);
    });
  });
});