import type { SessionData } from "express-session";

import { AuthenticationError } from "#/auth/auth.errors.js";

/**
 * Get the user's office claims from the session.
 *
 * @param session  Express session office.
 * @returns  List of office codes.
 */
export function getOfficeClaimsFromSession(session: SessionData): string[] {
  const offices = session.account?.idTokenClaims?.LAA_ACCOUNTS;

  if (Array.isArray(offices)) {
    return offices;
  }

  if (typeof offices === "string") {
    return [offices];
  }

  throw new AuthenticationError(
    "Invalid LAA_ACCOUNTS claim, expected string or string[]",
  );
}
