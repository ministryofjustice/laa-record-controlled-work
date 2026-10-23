import type { AccountInfo } from "@azure/msal-node";

import type { Office } from "#/journeys/select-office/select-office.types.js";

interface KnownClaims {
  idTokenClaims?: {
    APP_ROLES?: string;
    LAA_ACCOUNTS?: string | string[];
  };
}

interface SessionMsalReference {
  homeAccountId: string;
}

declare module "express-session" {
  interface SessionData {
    account?: AccountInfo & KnownClaims;
    authenticatedAt?: number;
    authFlowPending?: string;
    isAuthenticated?: boolean;
    journeyDrafts?: Record<string, Record<string, unknown>>;
    journeyDraftVersions?: Record<string, string>;
    journeySubmitted?: Record<string, boolean>;
    lastActivityAt?: number;
    msal?: SessionMsalReference;
    returnTo?: string;
    selectedOffice?: Office;
    singleOffice?: boolean;
  }
}
