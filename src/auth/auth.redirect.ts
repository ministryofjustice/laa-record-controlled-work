// returnTo accepts app-relative paths, resolved against this fixed base.
const APP_ORIGIN = "https://no-host";
const MAX_PATH_DECODE_PASSES = 3;
const DECODE_PASS_INCREMENT = 1;

// Reject C0 controls and DEL before URL parsing can rewrite them.
// eslint-disable-next-line no-control-regex -- URL parsing can rewrite these characters
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;
// Reject percent signs that do not start a two-digit escape.
const MALFORMED_ESCAPE = /%(?![0-9a-f]{2})/i;
// Detect one encoded byte, including nested escapes after each decode pass.
const ENCODED_BYTE = /%[0-9a-f]{2}/i;
// Reject path separators while they are still encoded.
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;
const AUTH_PATH = /^\/auth(?:\/|$)/i;

/**
 * Returns a validated same-origin application path or the root fallback.
 * @param value - Candidate redirect destination.
 * @returns A validated application path or `/`.
 */
export function getValidatedReturnTo(value: unknown): string {
  if (!isCandidateReturnTo(value)) return "/";

  try {
    const target = new URL(value, APP_ORIGIN);
    if (
      target.origin !== APP_ORIGIN ||
      !isLocalPath(target.pathname) ||
      !isSafePathname(target.pathname)
    ) {
      return "/";
    }

    return `${target.pathname}${target.search}${target.hash}`;
  } catch {
    return "/";
  }
}

/**
 * Checks that input is a well-formed app-relative path.
 * @param value - Candidate redirect destination.
 * @returns True when the input is an app-relative string.
 */
function isCandidateReturnTo(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("\\") &&
    !CONTROL_CHARACTERS.test(value) &&
    !MALFORMED_ESCAPE.test(value)
  );
}

/**
 * Checks that a parsed path stays outside the auth subtree.
 * @param pathname - Parsed URL pathname.
 * @returns True when the path is local and not under `/auth`.
 */
function isLocalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/") &&
    !pathname.startsWith("//") &&
    !AUTH_PATH.test(pathname)
  );
}

/**
 * Checks each encoded pathname layer before URL normalization.
 * @param pathname - Parsed URL pathname.
 * @returns True when the pathname is safe for a local redirect.
 */
function isSafePathname(pathname: string): boolean {
  // Work on a copy; the original encoded pathname is returned to the caller.
  let decodedPathname = pathname;

  // Decode one layer per pass to catch nested escapes.
  for (
    let pass = 0;
    pass < MAX_PATH_DECODE_PASSES;
    pass += DECODE_PASS_INCREMENT
  ) {
    // No escapes remain, so further decoding cannot change the path.
    if (!ENCODED_BYTE.test(decodedPathname)) return true;

    // Encoded separators can change path boundaries when decoded.
    if (ENCODED_PATH_SEPARATOR.test(decodedPathname)) return false;

    // Decode this layer, then reject controls and separators it revealed.
    decodedPathname = decodeURIComponent(decodedPathname);
    if (
      decodedPathname.includes("\\") ||
      CONTROL_CHARACTERS.test(decodedPathname) ||
      ENCODED_PATH_SEPARATOR.test(decodedPathname)
    ) {
      return false;
    }

    // URL parsing resolves dot segments; recheck origin and auth path.
    const decodedTarget = new URL(decodedPathname, APP_ORIGIN);
    if (
      decodedTarget.origin !== APP_ORIGIN ||
      !isLocalPath(decodedTarget.pathname)
    ) {
      return false;
    }
  }

  // Reject paths that still contain escapes after the bounded passes.
  return !ENCODED_BYTE.test(decodedPathname);
}
