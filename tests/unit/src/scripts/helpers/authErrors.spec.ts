import { AUTH_ERROR_MAP, mapAuthErrorToHttp } from "#src/lib/authErrors.js";
import { expect } from "chai";
import type { AuthError } from "#types/auth-types.js";

const errors: AuthError[] = [
  { type: "MissingAuthCodeRequest" },
  { type: "StateMismatch" },
  { type: "TokenAcquisitionFailed", cause: new Error() },
  { type: "PkceChallengeGeneration", cause: new Error() },
  { type: "MsalError", cause: new Error() },
];

describe("mapAuthErrorToHttp", () => {
  errors.forEach((error) => {
    it(`returns correct status and message for ${error.type}`, () => {
      expect(mapAuthErrorToHttp(error)).to.deep.equal(AUTH_ERROR_MAP[error.type]);
    });
  });
});
