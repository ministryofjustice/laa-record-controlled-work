const CACHE_KEY_PREFIX = "msal:";

/**
 * Builds the Redis key used to persist an MSAL cache blob for a session.
 * @param sessionId - The express-session ID.
 * @returns Redis key for this session's MSAL token cache.
 */
export function getMsalCacheKey(sessionId: string): string {
  return `${CACHE_KEY_PREFIX}${sessionId}`;
}
