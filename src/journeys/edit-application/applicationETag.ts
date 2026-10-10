const MAX_APPLICATION_ETAG = "9223372036854775807";
const APPLICATION_ETAG_PATTERN = /^"([0-9]+)"$/;

/**
 * Converts a validated ETag only when its version is safely representable.
 * @param etag Strong quoted decimal ETag.
 * @returns Numeric version suitable for the status API.
 */
export function applicationETagToNumber(
  etag: null | string | undefined,
): number {
  const { version } = parseApplicationETag(etag);
  const numericVersion = Number(version);

  if (!Number.isSafeInteger(numericVersion)) {
    throw new RangeError("Application ETag is not a safe integer");
  }

  return numericVersion;
}

/**
 * Validates a strong quoted decimal ETag without changing its spelling.
 * @param etag ETag header value.
 * @returns The exact ETag and its normalized decimal version.
 */
export function validateApplicationETag(
  etag: null | string | undefined,
): string {
  return parseApplicationETag(etag).etag;
}

/**
 * Parses and range-checks a quoted application version.
 * @param etag ETag header value.
 * @returns The original ETag and normalized decimal version.
 */
function parseApplicationETag(etag: null | string | undefined): {
  etag: string;
  version: string;
} {
  if (etag === null || etag === undefined) {
    throw new TypeError("Application ETag is missing or invalid");
  }

  const match = APPLICATION_ETAG_PATTERN.exec(etag);
  if (!match) {
    throw new TypeError("Application ETag is missing or invalid");
  }

  const [matchedValue, rawVersion] = match;
  if (matchedValue !== etag) {
    throw new TypeError("Application ETag is missing or invalid");
  }

  const version = rawVersion.replace(/^0+/, "") || "0";
  if (
    version.length > MAX_APPLICATION_ETAG.length ||
    (version.length === MAX_APPLICATION_ETAG.length &&
      version > MAX_APPLICATION_ETAG)
  ) {
    throw new RangeError("Application ETag is out of range");
  }

  return { etag, version };
}
