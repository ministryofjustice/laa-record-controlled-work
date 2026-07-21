import type { AccountInfo } from "@azure/msal-node";
import type { Session } from "express-session";

export interface SessionInterface extends Session {
  /** @property account User account, retrieved from MSAL/Entra after successful authentication. */
  account: AccountInfo | undefined;
  /** @property isAuthenticated True when the user has been successfully authenticated. */
  isAuthenticated: boolean | undefined;
  /** @property journeyDrafts Forge drafts of the user's current journey. */
  journeyDrafts: Record<string, unknown> | undefined;
  /** @property returnTo URI to return to after authentication flow completes. */
  returnTo: string | undefined;
}
