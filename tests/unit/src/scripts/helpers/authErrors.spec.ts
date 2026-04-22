import { mapAuthErrorToHttp } from "#src/lib/authErrorHttpResponses.js";
import { expect } from "chai";
import type { AuthError, MissingAuthCodeRequest, StateMismatch, TokenAcquisitionError, PkceGenerationError, MsalError } from "#types/auth-types.js";
import { BAD_REQUEST, INTERNAL_SERVER_ERROR, UNAUTHORIZED } from "#src/constants/httpStatus.js";

const AUTH_ERROR_HTTP_RESPONSES: Record<
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
  TokenAcquisitionError: {
    status: UNAUTHORIZED,
    message: "Token acquisition failed",
  },
  PkceGenerationError: {
    status: INTERNAL_SERVER_ERROR,
    message: "Failed to generate PKCE challenge",
  },
  MsalError: {
    status: INTERNAL_SERVER_ERROR,
    message: "Authentication service error",
  },
};

const errors: AuthError[] = [
  { type: "MissingAuthCodeRequest" } ,
  { type: "StateMismatch" } ,
  { type: "TokenAcquisitionError", cause: new Error() } ,
  { type: "PkceGenerationError", cause: new Error() } ,
  { type: "MsalError", cause: new Error() } ,
];

describe("mapAuthErrorToHttp", () => {
  errors.forEach((error) => {
    it(`returns correct status and message for ${error.type}`, () => {
      expect(mapAuthErrorToHttp(error)).to.deep.equal(AUTH_ERROR_HTTP_RESPONSES[error.type]);
    });
  });
});
