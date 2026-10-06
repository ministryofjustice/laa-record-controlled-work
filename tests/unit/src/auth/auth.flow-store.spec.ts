import { expect } from "chai";
import sinon from "sinon";

import { createAuthFlowStore } from "#/auth/auth.flow-store.js";
import config from "#/config.js";
import type { Either } from "#/lib/either.js";
import { getRedisClient } from "#/lib/redis.js";

const SESSION_ID = "initiating-session";
const EXPIRY_MS = 10 * 60 * 1000;
const FLOW = {
  authCodeRequest: {
    code: "",
    codeVerifier: "verifier",
    redirectUri: "http://localhost/auth/code/callback",
    scopes: ["scope.read"],
  },
  authState: "state-one",
  returnTo: "/cases/123",
};

function getValue<Err, Value>(result: Either<Err, Value>): Value {
  if ("error" in result) throw result.error;
  return result.value;
}

describe("Auth flow store", () => {
  let now: number;
  let store: ReturnType<typeof createAuthFlowStore>;

  beforeEach(() => {
    now = 1_800_000_000_000;
    store = createAuthFlowStore({ now: () => now });
  });

  it("expires a flow at its original ten-minute deadline", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    expect(reservation.value.expiresAt).to.equal(now + EXPIRY_MS);
    const published = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      FLOW,
    );
    expect(getValue(published)).to.be.true;
    expect(
      getValue(
        await store.authorizeRedirect(
          SESSION_ID,
          reservation.value.reservationId,
        ),
      ),
    ).to.be.true;

    now += EXPIRY_MS;
    expect(
      getValue(
        await store.authorizeRedirect(
          SESSION_ID,
          reservation.value.reservationId,
        ),
      ),
    ).to.be.false;
    const consumed = await store.consume(SESSION_ID, FLOW.authState);

    expect(getValue(consumed)).to.be.undefined;
  });

  it("does not extend expiry when preparation finishes late", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    now += EXPIRY_MS;
    const published = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      FLOW,
    );

    expect(getValue(published)).to.be.false;
  });

  it("preserves the current flow after a mismatched callback", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);
    const mismatched = await store.consume(SESSION_ID, "other-state");
    const matching = await store.consume(SESSION_ID, FLOW.authState);

    expect(getValue(mismatched)).to.be.undefined;
    expect(getValue(matching)).to.deep.equal(FLOW);
  });

  it("allows a matching callback to consume a flow only once", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);
    const first = await store.consume(SESSION_ID, FLOW.authState);
    const replay = await store.consume(SESSION_ID, FLOW.authState);

    expect(getValue(first)).to.deep.equal(FLOW);
    expect(getValue(replay)).to.be.undefined;
  });

  it("keeps a newer reservation when preparations finish out of order", async () => {
    const older = await store.reserve(SESSION_ID);
    const newer = await store.reserve(SESSION_ID);
    expect(older.error).to.be.undefined;
    expect(newer.error).to.be.undefined;
    if (older.error || newer.error) return;

    const stalePublish = await store.publish(
      SESSION_ID,
      older.value.reservationId,
      FLOW,
    );
    const newFlow = { ...FLOW, authState: "state-two" };
    const currentPublish = await store.publish(
      SESSION_ID,
      newer.value.reservationId,
      newFlow,
    );
    const staleCleanup = await store.abandon(
      SESSION_ID,
      older.value.reservationId,
    );
    const consumed = await store.consume(SESSION_ID, newFlow.authState);

    expect(getValue(stalePublish)).to.be.false;
    expect(getValue(currentPublish)).to.be.true;
    expect(staleCleanup.error).to.be.undefined;
    expect(getValue(consumed)).to.deep.equal(newFlow);
  });

  describe("backend selection", () => {
    afterEach(() => {
      sinon.restore();
    });

    for (const environment of ["development", "docker", "test"]) {
      it(`allows memory storage in ${environment}`, async () => {
        sinon.stub(config.redis, "enabled").value(false);
        sinon.stub(config.app, "environment").value(environment);

        const result = await createAuthFlowStore().reserve(SESSION_ID);

        expect(result.error).to.be.undefined;
      });
    }

    for (const environment of ["uat", "staging", "production", "unknown"]) {
      it(`requires Redis when disabled in ${environment}`, () => {
        sinon.stub(config.redis, "enabled").value(false);
        sinon.stub(config.app, "environment").value(environment);

        expect(() => createAuthFlowStore()).to.throw(
          "Redis is required for authentication flow storage",
        );
      });
    }

    it("fails every operation when enabled Redis is unavailable", async () => {
      sinon.stub(config.redis, "enabled").value(true);
      sinon.stub(getRedisClient(), "eval").rejects(new Error("Redis offline"));
      const store = createAuthFlowStore();

      const results = await Promise.all([
        store.reserve(SESSION_ID),
        store.publish(SESSION_ID, "reservation-id", FLOW),
        store.authorizeRedirect(SESSION_ID, "reservation-id"),
        store.consume(SESSION_ID, FLOW.authState),
        store.abandon(SESSION_ID, "reservation-id"),
      ]);

      expect(
        results.every(
          (result: { error?: unknown }) => result.error instanceof Error,
        ),
      ).to.be.true;
    });
  });
});