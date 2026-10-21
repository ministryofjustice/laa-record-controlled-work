import type { SessionData } from "express-session";

/**
 * Clear the selected office and its associated session context.
 *
 * Used when the user's selected office is no longer valid.
 *
 * @param session  Express session.
 */
export function destroySessionOffice(session: SessionData): void {
  // eslint-disable-next-line no-param-reassign -- Clear invalid office context.
  delete session.selectedOffice;
  // eslint-disable-next-line no-param-reassign -- Clear invalid office context.
  delete session.singleOffice;
  // eslint-disable-next-line no-param-reassign -- Clear drafts tied to office access.
  delete session.journeyDrafts;
  // eslint-disable-next-line no-param-reassign -- Clear draft versions with their drafts.
  delete session.journeyDraftVersions;
  // eslint-disable-next-line no-param-reassign -- Clear submitted state with its drafts.
  delete session.journeySubmitted;
}
