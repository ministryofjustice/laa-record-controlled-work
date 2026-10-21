import type { SessionData } from "express-session";

/* eslint-disable no-param-reassign -- Clear office-related session state. */

/**
 * Clear the selected office and its associated session context.
 *
 * Used when the user's selected office is no longer valid.
 *
 * @param session  Express session.
 */
export function destroySessionOffice(session: SessionData): void {
  delete session.selectedOffice;
  delete session.singleOffice;
  delete session.journeyDrafts;
  delete session.journeyDraftVersions;
  delete session.journeySubmitted;
}

/* eslint-enable no-param-reassign */
