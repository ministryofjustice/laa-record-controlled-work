/* eslint-disable jsdoc/require-jsdoc -- exported helpers are intentionally compact. */

export interface RcwApiAuthContext {
  getBearerToken: () => Promise<string>;
}

export const RCW_API_AUTH_CONTEXT_STATE_KEY = "rcwApiAuthContext";

export function isRcwApiAuthContext(
  candidate: unknown,
): candidate is RcwApiAuthContext {
  if (typeof candidate !== "object" || candidate === null) {
    return false;
  }

  const value = candidate as Partial<RcwApiAuthContext>;
  return typeof value.getBearerToken === "function";
}
