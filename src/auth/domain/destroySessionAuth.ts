import type { SessionData } from "express-session";

/**
 * Destroy the session auth data.
 *
 * Generally used when the user signs out or when the session is invalidated.
 *
 * @param session  Express session.
 */
export function destroySessionAuth(session: SessionData): void {
  // eslint-disable-next-line no-param-reassign -- We need to remove the account from the session.
  delete session.account;
}
