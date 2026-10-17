/**
 * Converts a strong quoted decimal ETag into a safe numeric version.
 * @param applicationETag - The raw ETag value.
 * @returns The safe numeric application version.
 * @throws {Error} When the ETag is missing, malformed, or unsafe.
 */
export function parseApplicationVersion(applicationETag: unknown): number {
  const quote = '"';
  if (typeof applicationETag !== "string") {
    throw new Error("Application ETag is missing or not a string");
  }
  if (!applicationETag.startsWith(quote) || !applicationETag.endsWith(quote)) {
    throw new Error("Application ETag must be a strong quoted value");
  }

  const version = applicationETag.slice(quote.length, -quote.length);
  if (!version) {
    throw new Error("Application ETag does not contain a version");
  }

  for (const character of version) {
    if (character < "0" || character > "9") {
      throw new Error("Application ETag must contain decimal digits only");
    }
  }

  const numericVersion = Number(version);
  if (!Number.isSafeInteger(numericVersion)) {
    throw new Error("Application ETag exceeds the safe integer range");
  }

  return numericVersion;
}
