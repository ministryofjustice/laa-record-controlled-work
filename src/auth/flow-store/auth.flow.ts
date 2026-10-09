import type { AuthFlow } from "#/auth/flow-store/flow-store.types.js";

import { MINUTE } from "#/lib/constants/time.js";

/* eslint-disable @typescript-eslint/no-magic-numbers -- intuitive auth flow lifetime */
export const AUTH_FLOW_LIFETIME = 10 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

export type AuthFlowRecord = PendingAuthFlowRecord | ReadyAuthFlowRecord;

export interface PendingAuthFlowRecord {
  expiresAt: number;
  reservationId: string;
  status: "pending";
}

export interface ReadyAuthFlowRecord extends AuthFlow {
  expiresAt: number;
  reservationId: string;
  status: "ready";
}

/** Creates a pending record with its fixed lifetime.
 * @param reservationId - The reservation identifier.
 * @param now - The current time in milliseconds.
 * @returns A pending auth-flow record.
 */
export function createPendingAuthFlowRecord(
  reservationId: string,
  now: number,
): PendingAuthFlowRecord {
  return {
    expiresAt: now + AUTH_FLOW_LIFETIME,
    reservationId,
    status: "pending",
  };
}

/** Checks whether a pending or ready record has expired.
 * @param record - The auth-flow record.
 * @param now - The current time in milliseconds.
 * @returns Whether the record has expired.
 */
export function isAuthFlowExpired(
  record: AuthFlowRecord,
  now: number,
): boolean {
  return record.expiresAt <= now;
}

/** Checks whether a reservation still owns its session record.
 * @param record - The current auth-flow record.
 * @param reservationId - The reservation identifier.
 * @returns Whether the reservation owns the record.
 */
export function isCurrentReservation(
  record: AuthFlowRecord | undefined,
  reservationId: string,
): record is AuthFlowRecord {
  return record?.reservationId === reservationId;
}

/** Checks whether a reservation can publish a pending record.
 * @param record - The current auth-flow record.
 * @param reservationId - The reservation identifier.
 * @returns Whether the reservation owns a pending record.
 */
export function isPendingReservation(
  record: AuthFlowRecord | undefined,
  reservationId: string,
): record is PendingAuthFlowRecord {
  return record?.status === "pending" && record.reservationId === reservationId;
}

/** Checks whether a reservation identifies a ready record.
 * @param record - The current auth-flow record.
 * @param reservationId - The reservation identifier.
 * @returns Whether the reservation owns a ready record.
 */
export function isReadyReservation(
  record: AuthFlowRecord | undefined,
  reservationId: string,
): record is ReadyAuthFlowRecord {
  return record?.status === "ready" && record.reservationId === reservationId;
}

/** Checks whether a ready record matches the callback state.
 * @param record - The current auth-flow record.
 * @param authState - The callback state.
 * @returns Whether the record matches the callback state.
 */
export function matchesReadyAuthFlow(
  record: AuthFlowRecord | undefined,
  authState: string,
): record is ReadyAuthFlowRecord {
  return record?.status === "ready" && record.authState === authState;
}

/** Converts a pending record into its published form.
 * @param record - The pending auth-flow record.
 * @param flow - The prepared auth flow.
 * @returns The ready auth-flow record.
 */
export function publishAuthFlow(
  record: PendingAuthFlowRecord,
  flow: AuthFlow,
): ReadyAuthFlowRecord {
  return { ...record, ...flow, status: "ready" };
}

/** Projects a ready record into the public flow value.
 * @param record - The ready auth-flow record.
 * @returns The public auth-flow value.
 */
export function toAuthFlow(record: ReadyAuthFlowRecord): AuthFlow {
  return {
    authCodeRequest: record.authCodeRequest,
    authState: record.authState,
    returnTo: record.returnTo,
  };
}
