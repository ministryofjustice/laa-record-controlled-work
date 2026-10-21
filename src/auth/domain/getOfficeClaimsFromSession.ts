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
  const offices: unknown = session.account?.idTokenClaims?.LAA_ACCOUNTS;

  if (typeof offices === "string") {
    return offices.length > ZERO_LENGTH ? [offices] : undefined;
  }

  if (Array.isArray(offices)) {
    const validOffices = offices.filter(
      (office): office is string =>
        typeof office === "string" && office.length > ZERO_LENGTH,
    );

    if (
      validOffices.length === offices.length &&
      validOffices.length !== ZERO_LENGTH
    ) {
      return validOffices;
    }
  }

  return undefined;
}
