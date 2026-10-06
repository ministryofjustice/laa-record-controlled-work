import type { AuthFlow } from "#/auth/auth.flow-store.js";
import type { Either } from "#/lib/either.js";

export const SESSION_ID = "initiating-session";
export const EXPIRY_MS = 10 * 60 * 1000;
export const FLOW: AuthFlow = {
  authCodeRequest: {
    code: "",
    codeVerifier: "verifier",
    redirectUri: "http://localhost/auth/code/callback",
    scopes: ["scope.read"],
  },
  authState: "state-one",
  returnTo: "/cases/123",
};

export function getValue<Err, Value>(result: Either<Err, Value>): Value {
  if ("error" in result) throw result.error;
  return result.value;
}