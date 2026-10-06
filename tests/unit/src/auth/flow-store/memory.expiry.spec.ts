import { expect } from "chai";

import { createAuthFlowStore } from "#/auth/auth.flow-store.js";
import { EXPIRY_MS, FLOW, getValue, SESSION_ID } from "#tests/unit/src/auth/flow-store/fixtures.js";

describe("Memory auth flow expiry", () => {
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
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.be
      .undefined;
  });

  it("consumes only before the original expiry deadline", async () => {
    const start = now;

    for (const offset of [-1, 0, 1]) {
      now = start;
      const sessionId = `${SESSION_ID}-${offset}`;
      const reservation = await store.reserve(sessionId);
      expect(reservation.error).to.be.undefined;
      if (reservation.error) return;

      await store.publish(sessionId, reservation.value.reservationId, FLOW);
      now = reservation.value.expiresAt + offset;

      expect(
        getValue(await store.consume(sessionId, FLOW.authState)),
      ).to.deep.equal(offset < 0 ? FLOW : undefined);
    }
  });

  it("publishes only before the original expiry deadline", async () => {
    const start = now;

    for (const offset of [-1, 0, 1]) {
      now = start;
      const sessionId = `${SESSION_ID}-publish-${offset}`;
      const reservation = await store.reserve(sessionId);
      expect(reservation.error).to.be.undefined;
      if (reservation.error) return;

      now = reservation.value.expiresAt + offset;
      const published = await store.publish(
        sessionId,
        reservation.value.reservationId,
        FLOW,
      );

      expect(getValue(published)).to.equal(offset < 0);
    }
  });

  it("authorizes redirects only before the original expiry deadline", async () => {
    const start = now;

    for (const offset of [-1, 0, 1]) {
      now = start;
      const sessionId = `${SESSION_ID}-authorize-${offset}`;
      const reservation = await store.reserve(sessionId);
      expect(reservation.error).to.be.undefined;
      if (reservation.error) return;
      await store.publish(sessionId, reservation.value.reservationId, FLOW);

      now = reservation.value.expiresAt + offset;
      expect(
        getValue(
          await store.authorizeRedirect(
            sessionId,
            reservation.value.reservationId,
          ),
        ),
      ).to.equal(offset < 0);
    }
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
});