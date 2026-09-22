import type { SessionData } from "express-session";

/**
 * Destroy the session selected office.
 *
 * Removes the user's selected office from the session. Typically used when the user has an invlaid office.
 *
 * @param session  Express session.
 */
export function destroySessionOffice(session: SessionData): void {
  // eslint-disable-next-line no-param-reassign -- We need to remove the account from the session.
  delete session.selectedOffice;
}
