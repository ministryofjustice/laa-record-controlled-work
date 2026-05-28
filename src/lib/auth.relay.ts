import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

const SERVICE = "laa-record-controlled-work";
// matches output from scripts/release-name.sh
const ALLOWED_RELAY_HOSTNAME_PATTERN = new RegExp(
  `^[a-z0-9]([a-z0-9-]*[a-z0-9])?-${SERVICE}-uat\\.cloud-platform\\.service\\.justice\\.gov\\.uk$`,
);

const relayStateSchema = z.object({
  /** Cryptographically random nonce, used for CSRF protection and state matching. */
  nonce: z.string(),
  /** HMAC-SHA256 hex signature over `nonce` and `target`. */
  signature: z.string(),
  /** The HTTPS origin of the ephemeral environment that initiated the sign-in. */
  target: z.string(),
});

export type RelayState = z.infer<typeof relayStateSchema>;

/**
 * Creates a base64-encoded relay state string for use as the OAuth `state` parameter.
 *
 * Encodes the nonce and target as JSON, signs the with an HMAC-SHA256
 * signature derived from the secret, then base64 encodes the result.
 * The state is stored in the session and verified on callback before any token exchange.
 *
 * @param nonce - A cryptographically random UUID to prevent CSRF attacks.
 * @param target - The HTTPS origin of the ephemeral environment
 * @param secret - The session secret used to sign the.
 * @returns A base64-encoded JSON string containing `{ nonce, signature, target }`.
 */
export function createRelayState(
  nonce: string,
  target: string,
  secret: string,
): string {
  const signature = sign({ nonce, target }, secret);
  return Buffer.from(JSON.stringify({ nonce, signature, target })).toString(
    "base64",
  );
}

/**
 * Returns `true` if the given URL is a permitted relay target.
 *
 * A valid target must use HTTPS and its hostname must match the ALLOWED_RELAY_HOSTNAME_PATTERN.
 *
 * @param target - The full HTTPS origin URL to validate.
 * @returns `true` if the target is an allowed ephemeral environment origin, `false` otherwise.
 */
export function isAllowedRelayTarget(target: string): boolean {
  try {
    const url = new URL(target);
    return (
      url.protocol === "https:" &&
      ALLOWED_RELAY_HOSTNAME_PATTERN.test(url.hostname)
    );
  } catch {
    return false;
  }
}

/**
 * Attempts to parse a base64-encoded OAuth state string as a relay state.
 *
 * Returns `null` for any plain (non-relay) state values, invalid base64, non-JSON content,
 * or JSON that does not conform to the `RelayState` shape. This allows the caller
 * to distinguish relay callbacks from normal callbacks without throwing.
 *
 * @param stateString - The raw `state` query parameter value from the OAuth callback.
 * @returns The decoded `RelayState` if the string is a valid relay state, or `null`.
 */
export function parseRelayState(stateString: string): null | RelayState {
  try {
    const decoded = JSON.parse(
      Buffer.from(stateString, "base64").toString("utf8"),
    ) as unknown;

    const { data } = relayStateSchema.safeParse(decoded);
    return data ?? null;
  } catch {
    return null;
  }
}

/**
 * Verifies the HMAC-SHA256 signature of a relay state.
 *
 * Recomputes the expected signature from `state.nonce` and `state.target` using the
 * provided secret, then compares it against `state.signature` using a timing-safe equality
 * check to prevent timing attacks.
 *
 * @param state - The decoded relay state to verify.
 * @param secret - The session secret used when the state was originally signed.
 * @returns `true` if the signature is valid, `false` if it has been tampered with or the secret differs.
 */
export function verifyRelayState(state: RelayState, secret: string): boolean {
  const signed = sign(state, secret);
  const expected = Buffer.from(signed);
  const actual = Buffer.from(state.signature);

  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}

/**
 * Computes an HMAC-SHA256 hex digest over the relay state fields.
 *
 * The message format is `{nonce}:{target}`, providing domain separation between fields.
 *
 * @param state - The relay state fields to sign.
 * @param state.nonce - Relay state nonce
 * @param state.target - Relay state target
 * @param secret - The HMAC signing key.
 * @returns A hex-encoded HMAC-SHA256 digest.
 */
function sign(state: Omit<RelayState, "signature">, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${state.nonce}:${state.target}`)
    .digest("hex");
}
