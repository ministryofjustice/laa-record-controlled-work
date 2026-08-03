import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";

import type { PKCECodes } from "#/auth/auth.types.js";
import type { Office } from "#/journeys/select-office/mappers/office.dto.js";

interface SessionMsalReference {
  homeAccountId: string;
}

declare module "express-session" {
  interface SessionData {
    account?: AccountInfo;
    authCodeRequest?: AuthorizationCodeRequest;
    authCodeUrlRequest?: AuthorizationUrlRequest;
    authState?: string;
    isAuthenticated?: boolean;
    journeyDrafts?: Record<string, Record<string, unknown>>;
    journeySubmitted?: Record<string, boolean>;
    msal?: SessionMsalReference;
    pkceCodes?: PKCECodes;
    returnTo?: string;
    selectedOffice?: Office;
    singleOffice?: boolean;
  }
}
