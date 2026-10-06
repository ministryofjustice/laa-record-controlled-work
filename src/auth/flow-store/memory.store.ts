import { randomUUID } from "node:crypto";

import type {
  AuthFlowReservation,
  AuthFlowStore,
  StoreResult,
} from "#/auth/flow-store/flow-store.types.js";

import {
  type AuthFlowRecord,
  createPendingAuthFlowRecord,
  isAuthFlowExpired,
  isCurrentReservation,
  isPendingReservation,
  isReadyReservation,
  matchesReadyAuthFlow,
  publishAuthFlow,
  toAuthFlow,
} from "#/auth/flow-store/auth.flow.js";
import { success } from "#/lib/either.js";

/** Creates a process-local store using the supplied clock.
 * @param now - The current-time provider.
 * @returns A process-local auth-flow store.
 */
export function createMemoryAuthFlowStore(now: () => number): AuthFlowStore {
  const flows = new Map<string, AuthFlowRecord>();

  return {
    abandon: (sessionId, reservationId) => {
      if (isCurrentReservation(flows.get(sessionId), reservationId)) {
        flows.delete(sessionId);
      }
      return success(undefined);
    },
    authorizeRedirect: (sessionId, reservationId) => {
      const current = flows.get(sessionId);
      if (!isReadyReservation(current, reservationId)) {
        return success(false);
      }
      if (isAuthFlowExpired(current, now())) {
        flows.delete(sessionId);
        return success(false);
      }
      return success(true);
    },
    consume: (sessionId, authState) => {
      const current = flows.get(sessionId);
      if (!matchesReadyAuthFlow(current, authState)) {
        return success(undefined);
      }
      if (isAuthFlowExpired(current, now())) {
        flows.delete(sessionId);
        return success(undefined);
      }
      flows.delete(sessionId);
      return success(toAuthFlow(current));
    },
    publish: (sessionId, reservationId, flow) => {
      const current = flows.get(sessionId);
      if (!isPendingReservation(current, reservationId)) {
        return success(false);
      }
      if (isAuthFlowExpired(current, now())) {
        flows.delete(sessionId);
        return success(false);
      }
      flows.set(sessionId, publishAuthFlow(current, flow));
      return success(true);
    },
    reserve: (sessionId): StoreResult<AuthFlowReservation> => {
      const reservationTime = now();
      for (const [flowSessionId, flowRecord] of flows) {
        if (isAuthFlowExpired(flowRecord, reservationTime)) {
          flows.delete(flowSessionId);
        }
      }
      const reservation = createPendingAuthFlowRecord(
        randomUUID(),
        reservationTime,
      );
      flows.set(sessionId, reservation);
      return success({
        expiresAt: reservation.expiresAt,
        reservationId: reservation.reservationId,
      });
    },
  };
}
