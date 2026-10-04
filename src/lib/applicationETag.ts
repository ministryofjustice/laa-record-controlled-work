const STRONG_QUOTED_INTEGER = /^"(?<version>[0-9]+)"$/;
const MAX_APPLICATION_VERSION = 9_223_372_036_854_775_807n;

/**
 * Validates and returns the exact strong quoted application version.
 * @param value Candidate response header value.
 * @returns The original quoted ETag.
 */
export function parseApplicationETag(value: unknown): string {
  return parseVersion(value).etag;
}

/**
 * Converts an application version only when it is safely numeric.
 * @param value Candidate response header value.
 * @returns The validated version as a safe integer.
 */
export function parseSafeApplicationETag(value: unknown): number {
  const { version } = parseVersion(value);

  if (version > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Application ETag cannot be represented safely");
  }

  return Number(version);
}

/**
 * Parses a strong quoted version within signed 64-bit bounds.
 * @param value Candidate response header value.
 * @returns The original ETag and its exact integer version.
 */
function parseVersion(value: unknown): { etag: string; version: bigint } {
  if (typeof value !== "string") {
    throw new Error("Application ETag is missing or invalid");
  }

  const versionText = STRONG_QUOTED_INTEGER.exec(value)?.groups?.version;
  if (!versionText) {
    throw new Error("Application ETag is missing or invalid");
  }

  const version = BigInt(versionText);
  if (version > MAX_APPLICATION_VERSION) {
    throw new Error("Application ETag is missing or invalid");
  }

  return { etag: value, version };
}
