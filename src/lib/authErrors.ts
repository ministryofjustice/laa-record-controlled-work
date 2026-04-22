import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#src/constants/httpStatus.js";
import type { AuthError } from "#types/auth-types.js";

export const AUTH_ERROR_MAP: Record<
  AuthError["type"],
  { status: number; message: string }
> = {
  MissingAuthCodeRequest: {
    status: BAD_REQUEST,
    message: "Missing auth code request in session",
  },
  StateMismatch: {
    status: BAD_REQUEST,
    message: "State mismatch: possible CSRF attack",
  },
  TokenAcquisitionFailed: {
    status: UNAUTHORIZED,
    message: "Token acquisition failed",
  },
  PkceChallengeGeneration: {
    status: INTERNAL_SERVER_ERROR,
    message: "Failed to generate PKCE challenge",
  },
  MsalError: {
    status: INTERNAL_SERVER_ERROR,
    message: "Authentication service error",
  },
};

/**
 * Maps an AuthError to an HTTP status code and user-facing message.
 * @param error - The auth error to map.
 * @returns {{ status: number; message: string }} The HTTP status and message.
 */
export function mapAuthErrorToHttp(error: AuthError): {
  status: number;
  message: string;
} {
  return AUTH_ERROR_MAP[error.type];
}
