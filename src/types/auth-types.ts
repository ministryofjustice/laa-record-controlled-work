/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";

import { z } from "zod";

export const authCodeResponseSchema = z.object({
  code: z.string().min(1),
  session_state: z.string().optional(),
  state: z.string().min(1),
});
export type AuthCodeResponse = z.infer<typeof authCodeResponseSchema>;

export interface PKCECodes {
  challenge: string;
  challengeMethod: string;
  verifier: string;
}

//  INFO: extend express-session SessionData type for MSAL integration of account and token cache
declare module "express-session" {
  interface SessionData {
    account?: AccountInfo;
    authCodeRequest?: AuthorizationCodeRequest;
    authCodeUrlRequest?: AuthorizationUrlRequest;
    authState?: string;
    idToken?: string;
    isAuthenticated?: boolean;
    pkceCodes?: PKCECodes;
    returnTo?: string;
    tokenCache?: string;
  }
}
