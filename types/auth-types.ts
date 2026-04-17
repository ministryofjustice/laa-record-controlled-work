/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";
import { z } from "zod";

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
