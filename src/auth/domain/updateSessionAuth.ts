import type { AuthenticationResult } from "@azure/msal-node";
import type { Session } from "express-session";

/**
 * Update the session with the result of a successful token exchange.
 *
 * @param session  Express session.
 * @param result  Result of an auth token exchange.
 */
export function updateSessionAuth(
  session: Session,
  result: AuthenticationResult,
): void {
  const { account } = result;
  Object.assign(session, {
    account,
  });
}
