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

export type AuthCodeResponse = z.infer<typeof authCodeResponseSchema>;

export interface AuthState {
  successRedirect: string;
}

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
    authState?: string;
    returnTo?: string;
    tokenCache?: string;
    account?: AccountInfo;
    idToken?: string;
    isAuthenticated?: boolean;
    pkceCodes?: PKCECodes;
    authCodeUrlRequest?: AuthorizationUrlRequest;
    authCodeRequest?: AuthorizationCodeRequest;
  }
}
