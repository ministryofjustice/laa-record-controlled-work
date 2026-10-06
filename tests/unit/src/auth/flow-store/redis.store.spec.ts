import { expect } from "chai";
import sinon from "sinon";

import { createAuthFlowStore } from "#/auth/flow-store/flow-store.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";
import {
  FLOW,
  getValue,
  SESSION_ID,
} from "#tests/unit/src/auth/flow-store/fixtures.js";

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

describe("Redis auth flow replies", () => {
  beforeEach(() => {
    sinon.stub(config.redis, "enabled").value(true);
    sinon.stub(config.app, "environment").value("test");
  });

  afterEach(() => {
    sinon.restore();
  });

  for (const [caseName, reply] of [
    ["invalid JSON", "not-json"],
    ["pending record", JSON.stringify({ status: "pending" })],
  ]) {
    it(`returns an error for a malformed consumed ${caseName}`, async () => {
      sinon.stub(getRedisClient(), "eval").callsFake(async () => reply);

      const result = await createAuthFlowStore().consume(
        SESSION_ID,
        FLOW.authState,
      );

      expect(result.error).to.be.instanceOf(Error);
    });
  }

  for (const [caseName, reply] of [
    ["null", null],
    ["object", {}],
    ["non-numeric", "not-a-number"],
    ["fractional", "1.5"],
    ["unsafe integer", String(Number.MAX_SAFE_INTEGER + 1)],
  ]) {
    it(`returns an error for a ${caseName} reservation reply`, async () => {
      sinon.stub(getRedisClient(), "eval").callsFake(async () => reply);

      const result = await createAuthFlowStore().reserve(SESSION_ID);

      expect(result.error).to.be.instanceOf(Error);
    });
  }

  it("preserves request extension fields from a consumed record", async () => {
    const authCodeRequest = {
      ...FLOW.authCodeRequest,
      requestExtension: { value: "retained" },
    };
    const storedRecord = {
      ...FLOW,
      authCodeRequest,
      expiresAt: Number.MAX_SAFE_INTEGER,
      reservationId: "reservation-id",
      status: "ready",
    };
    sinon
      .stub(getRedisClient(), "eval")
      .callsFake(async () => JSON.stringify(storedRecord));

    const result = await createAuthFlowStore().consume(
      SESSION_ID,
      FLOW.authState,
    );

    expect(getValue(result)).to.deep.equal({ ...FLOW, authCodeRequest });
  });
});