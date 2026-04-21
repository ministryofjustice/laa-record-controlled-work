import {
  BAD_REQUEST,
  INTERNAL_SERVER_ERROR,
  UNAUTHORIZED,
} from "#src/constants/httpStatus.js";

export type AuthError =
  | { type: "MissingAuthCodeRequest" }
  | { type: "StateMismatch" }
  | { type: "TokenAcquisitionFailed"; cause: unknown }
  | { type: "PkceChallengeGeneration"; cause: unknown }
  | { type: "MsalError"; cause: unknown };

/**
 * Maps an AuthError to an HTTP status code and user-facing message.
 * @param {AuthError} error - The auth error to map.
 * @returns {{ status: number; message: string }} The HTTP status and message.
 */
export function mapAuthErrorToHttp(error: AuthError): {
  status: number;
  message: string;
} {
  switch (error.type) {
    case "MissingAuthCodeRequest":
      return {
        status: BAD_REQUEST,
        message: "Missing auth code request in session",
      };
    case "StateMismatch":
      return {
        status: BAD_REQUEST,
        message: "State mismatch: possible CSRF attack",
      };
    case "TokenAcquisitionFailed":
      return { status: UNAUTHORIZED, message: "Token acquisition failed" };
    case "PkceChallengeGeneration":
      return {
        status: INTERNAL_SERVER_ERROR,
        message: "Failed to generate PKCE challenge",
      };
    case "MsalError":
      return {
        status: INTERNAL_SERVER_ERROR,
        message: "Authentication service error",
      };
  }
}
