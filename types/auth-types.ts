/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import { z } from "zod";
import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";
import type session from "express-session";

export const authCodeResponseSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  session_state: z.string().optional(),
});

export const authStateSchema = z.object({
  // Allows paths starting with a single "/" (e.g. /dashboard).
  // The negative lookahead (?!\/) rejects protocol-relative URLs (//bad.com).
  // Rejects absolute URLs and whitespace.
  successRedirect: z
    .string()
    .regex(
      /^\/(?!\/)[^\s]*$/,
      "successRedirect must be an app-internal path starting with a single /",
    ),
});

export type AuthCodeResponse = z.infer<typeof authCodeResponseSchema>;
export type AuthState = z.infer<typeof authStateSchema>;

export interface PKCECodes {
  challengeMethod: string;
  verifier: string;
  challenge: string;
}

// INFO: extend Express Request type for MSAL integration of user and tokens and allowing undefined in session
declare global {
  namespace Express {
    interface Request {
      accessToken?: string;
      user?: AccountInfo;
      session: session.Session & Partial<session.SessionData>;
    }
  }
}
//  INFO: extend express-session SessionData type for MSAL integration of account and token cache

declare module "express-session" {
  interface SessionData {
    msalTokenCache?: string;
    authState?: string;
    returnTo?: string;
    tokenCache?: string;
    accessToken?: string;
    account?: AccountInfo;
    idToken?: string;
    isAuthenticated?: boolean;
    pkceCodes?: PKCECodes;
    authCodeUrlRequest?: AuthorizationUrlRequest;
    authCodeRequest?: AuthorizationCodeRequest;
  }
}
