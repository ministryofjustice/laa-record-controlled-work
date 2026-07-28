/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import type {
  AccountInfo,
  AuthorizationCodeRequest,
  AuthorizationUrlRequest,
} from "@azure/msal-node";

import { z } from "zod";

export const authCodeCallbackSchema = z.object({
  code: z.string().min(1),
  session_state: z.string().optional(),
  state: z.string().min(1),
});

export const authCodeCallbackErrorSchema = z.object({
  error: z.string().min(1),
  error_description: z.string().optional(),
  state: z.string().optional(),
});

export interface AuthCodeFlowState {
  authCodeRequest: AuthorizationCodeRequest;
  authCodeUrl: string;
  authCodeUrlRequest: AuthorizationUrlRequest;
  authState: string;
  pkceCodes: PKCECodes;
  returnTo: string;
}

export interface PKCECodes {
  challenge: string;
  challengeMethod: string;
  verifier: string;
}

export interface TokenExchangeResult {
  accessToken: string | undefined;
  account: AccountInfo | undefined;
  idToken: string | undefined;
}
