import type { SessionData } from "express-session";

const ZERO_LENGTH = 0;

/**
 * Get the user's office claims from the session.
 *
 * @param session  Express session office.
 * @returns  List of office codes.
 */
export function getOfficeClaimsFromSession(
  session: SessionData,
): string[] | undefined {
  const offices = session.account?.idTokenClaims?.LAA_ACCOUNTS;

  // Allow an empty array to fall through to `undefined` to simplify checks, as
  // semantically it's the same thing.
  if (Array.isArray(offices) && offices.length !== ZERO_LENGTH) {
    return offices;
  }

  if (typeof offices === "string") {
    return [offices];
  }

  return undefined;
}
