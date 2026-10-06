import { expect } from "chai";
import sinon from "sinon";

import { createAuthFlowStore } from "#/auth/auth.flow-store.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";
import { FLOW, SESSION_ID } from "#tests/unit/src/auth/flow-store/fixtures.js";

describe("Auth flow store Redis failures", () => {
  afterEach(() => {
    sinon.restore();
  });

  for (const environment of ["development", "docker", "test"]) {
    it(`fails every operation when Redis is unavailable in ${environment}`, async () => {
      sinon.stub(config.redis, "enabled").value(true);
      sinon.stub(config.app, "environment").value(environment);
      sinon.stub(getRedisClient(), "eval").rejects(new Error("Redis offline"));
      const store = createAuthFlowStore();

      const operations = [
        store.reserve(SESSION_ID),
        store.publish(SESSION_ID, "reservation-id", FLOW),
        store.authorizeRedirect(SESSION_ID, "reservation-id"),
        store.consume(SESSION_ID, FLOW.authState),
        store.abandon(SESSION_ID, "reservation-id"),
      ];
      expect(operations.every((operation) => operation instanceof Promise)).to.be
        .true;
      const results = await Promise.all(operations);

      expect(
        results.every(
          (result: { error?: unknown }) => result.error instanceof Error,
        ),
      ).to.be.true;
    });
  }
});