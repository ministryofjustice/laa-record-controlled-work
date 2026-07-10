import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";

import type { PKCECodes } from "#/auth/auth.types.js";

declare module "express-session" {
  interface SessionData {
    account?: AccountInfo;
    authCodeRequest?: AuthorizationCodeRequest;
    authCodeUrlRequest?: AuthorizationUrlRequest;
    authState?: string;
    isAuthenticated?: boolean;
    pkceCodes?: PKCECodes;
    returnTo?: string;
  }
}
