import type { Session, SessionData } from "express-session";

import { HOUR, MINUTE } from "#/lib/constants/time.js";

const FIRST_VALID_TIMESTAMP = 1;
const MINIMUM_COOKIE_MAX_AGE_MS = 0;
type AuthenticatedSession = Required<
  Pick<SessionData, "authenticatedAt" | "lastActivityAt">
> &
  Session &
  SessionData;

/* eslint-disable @typescript-eslint/no-magic-numbers -- session limits are policy values */
export const SESSION_IDLE_TIMEOUT_MS = 30 * MINUTE;
export const SESSION_ABSOLUTE_TIMEOUT_MS = 12 * HOUR;
/* eslint-enable @typescript-eslint/no-magic-numbers */

/**
 * Calculates the earlier idle or absolute lifecycle deadline.
 * @param session - A session with valid lifecycle metadata.
 * @returns The earlier idle or absolute deadline in milliseconds.
 */
export function lifecycleExpiresAt(session: AuthenticatedSession): number {
  const { authenticatedAt, lastActivityAt } = session;
  const absoluteExpiresAt = authenticatedAt + SESSION_ABSOLUTE_TIMEOUT_MS;
  const idleExpiresAt = lastActivityAt + SESSION_IDLE_TIMEOUT_MS;

  return Math.min(absoluteExpiresAt, idleExpiresAt);
}

/**
 * Checks that authenticated session lifecycle metadata is valid.
 * @param session - The session to check.
 * @param now - The current server time in milliseconds.
 * @returns True when the session contains valid, ordered timestamps.
 */
export function hasValidLifecycle(
  session: Session & SessionData,
  now: number,
): session is AuthenticatedSession {
  const { authenticatedAt, lastActivityAt } = session;
  return (
    isValidTimestamp(authenticatedAt) &&
    isValidTimestamp(lastActivityAt) &&
    authenticatedAt <= lastActivityAt &&
    lastActivityAt <= now
  );
}

/**
 * Renews the session lifecycle and returns its bounded deadline.
 * @param session - The authenticated session.
 * @param now - The current server time in milliseconds.
 * @returns The earlier idle or absolute deadline.
 */
export function renewLifecycle(
  session: AuthenticatedSession,
  now: number,
): number {
  const authenticatedSession = session;
  const { authenticatedAt } = authenticatedSession;
  authenticatedSession.lastActivityAt = now;
  const expiresAt = Math.min(
    authenticatedAt + SESSION_ABSOLUTE_TIMEOUT_MS,
    now + SESSION_IDLE_TIMEOUT_MS,
  );
  authenticatedSession.cookie.maxAge = Math.max(
    MINIMUM_COOKIE_MAX_AGE_MS,
    expiresAt - now,
  );
  return expiresAt;
}

/**
 * Starts an authenticated session lifecycle.
 * @param session - The session to initialize.
 * @param now - The current server time in milliseconds.
 */
export function setLifecycle(
  session: Session & SessionData,
  now: number,
): void {
  const authenticatedSession = session;
  authenticatedSession.authenticatedAt = now;
  authenticatedSession.lastActivityAt = now;
  authenticatedSession.cookie.maxAge = SESSION_IDLE_TIMEOUT_MS;
}

/**
 * Checks whether a value is a positive, safe integer timestamp.
 * @param value - The value to validate.
 * @returns True when the value is a valid timestamp.
 */
function isValidTimestamp(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= FIRST_VALID_TIMESTAMP
  );
}
