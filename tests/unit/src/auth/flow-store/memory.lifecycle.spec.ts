import { expect } from "chai";

import { createAuthFlowStore } from "#/auth/flow-store/flow-store.js";
import {
  EXPIRY_MS,
  FLOW,
  getValue,
  SESSION_ID,
} from "#tests/unit/src/auth/flow-store/fixtures.js";

describe("Memory auth flow lifecycle", () => {
  let now: number;
  let store: ReturnType<typeof createAuthFlowStore>;

  beforeEach(() => {
    now = 1_800_000_000_000;
    store = createAuthFlowStore({ now: () => now });
  });

  it("returns reservation metadata without exposing record status", async () => {
    const reservation = store.reserve(SESSION_ID);
    expect(reservation).not.to.be.instanceOf(Promise);
    if (reservation instanceof Promise) return;
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    expect(reservation.value).to.deep.equal({
      expiresAt: now + EXPIRY_MS,
      reservationId: reservation.value.reservationId,
    });
  });

  it("keeps a pending reservation available after a callback", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    const pending = await store.consume(SESSION_ID, FLOW.authState);
    const published = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      FLOW,
    );
    const matching = await store.consume(SESSION_ID, FLOW.authState);

    expect(getValue(pending)).to.be.undefined;
    expect(getValue(published)).to.be.true;
    expect(getValue(matching)).to.deep.equal(FLOW);
  });

  it("preserves the current flow after a mismatched callback", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);
    const mismatched = await store.consume(SESSION_ID, "other-state");

    expect(getValue(mismatched)).to.be.undefined;
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.deep
      .equal(FLOW);
  });

  it("allows a matching callback to consume a flow only once", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);

    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.deep
      .equal(FLOW);
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.be
      .undefined;
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

    expect(getValue(stalePublish)).to.be.false;
    expect(getValue(currentPublish)).to.be.true;
    expect(staleCleanup.error).to.be.undefined;
    expect(getValue(await store.consume(SESSION_ID, newFlow.authState))).to
      .deep.equal(newFlow);
  });

  it("invalidates a redirect-authorized flow when a newer reservation replaces it", async () => {
    const older = await store.reserve(SESSION_ID);
    expect(older.error).to.be.undefined;
    if (older.error) return;
    await store.publish(SESSION_ID, older.value.reservationId, FLOW);
    expect(
      getValue(
        await store.authorizeRedirect(SESSION_ID, older.value.reservationId),
      ),
    ).to.be.true;

    const newer = await store.reserve(SESSION_ID);
    expect(newer.error).to.be.undefined;
    if (newer.error) return;
    const newFlow = { ...FLOW, authState: "state-two" };
    await store.publish(SESSION_ID, newer.value.reservationId, newFlow);

    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.be
      .undefined;
    expect(getValue(await store.consume(SESSION_ID, newFlow.authState))).to.deep
      .equal(newFlow);
  });

  it("keeps flows isolated between sessions", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;
    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);

    expect(
      getValue(await store.consume(`${SESSION_ID}-other`, FLOW.authState)),
    ).to.be.undefined;
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.deep
      .equal(FLOW);
  });

  it("rejects repeated publication without replacing the ready flow", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;
    const first = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      FLOW,
    );
    const repeated = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      { ...FLOW, authState: "state-two" },
    );

    expect(getValue(first)).to.be.true;
    expect(getValue(repeated)).to.be.false;
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.deep
      .equal(FLOW);
  });

  it("abandons a matching pending reservation", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;

    const abandoned = await store.abandon(
      SESSION_ID,
      reservation.value.reservationId,
    );
    const published = await store.publish(
      SESSION_ID,
      reservation.value.reservationId,
      FLOW,
    );

    expect(abandoned.error).to.be.undefined;
    expect(getValue(published)).to.be.false;
  });

  it("abandons a matching published flow", async () => {
    const reservation = await store.reserve(SESSION_ID);
    expect(reservation.error).to.be.undefined;
    if (reservation.error) return;
    await store.publish(SESSION_ID, reservation.value.reservationId, FLOW);

    const abandoned = await store.abandon(
      SESSION_ID,
      reservation.value.reservationId,
    );

    expect(abandoned.error).to.be.undefined;
    expect(getValue(await store.consume(SESSION_ID, FLOW.authState))).to.be
      .undefined;
  });
});