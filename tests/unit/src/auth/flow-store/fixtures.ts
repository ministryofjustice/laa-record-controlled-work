import type { AuthFlow } from "#/auth/flow-store/flow-store.types.js";
import type { Either } from "#/lib/either.js";

import { AUTH_FLOW_LIFETIME } from "#/auth/flow-store/auth.flow.js";

export const SESSION_ID = "initiating-session";
export const EXPIRY_MS = AUTH_FLOW_LIFETIME;
export const FLOW: AuthFlow = {
  authCodeRequest: {
    code: "",
    codeVerifier: "verifier",
    nonce: "flow-nonce",
    redirectUri: "http://localhost/auth/code/callback",
    scopes: ["scope.read"],
  },
  authState: "state-one",
  returnTo: "/cases/123",
};

/** Unwraps a successful store result for an assertion.
 * @param result - The result to unwrap.
 * @returns The successful result value.
 */
export function getValue<Value>(result: Either<Error, Value>): Value {
  if (!("value" in result)) {
    throw result.error instanceof Error
      ? result.error
      : new Error("Auth flow store failed");
  }
  return result.value;
}
