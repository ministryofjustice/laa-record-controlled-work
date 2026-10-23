import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";

/**
 * Deletes the MSAL token cache associated with a session.
 * @param sessionId - The Express session identifier.
 */
export async function deleteMsalCache(sessionId: string): Promise<void> {
  if (!config.redis.enabled) return;

  await getRedisClient().del(getMsalCacheKey(sessionId));
}

/**
 * Sets the MSAL token cache expiry to the session's absolute deadline.
 * @param sessionId - The Express session identifier.
 * @param expiresAt - The absolute expiry time in milliseconds.
 */
export async function setMsalCacheExpiry(
  sessionId: string,
  expiresAt: number,
): Promise<void> {
  if (!config.redis.enabled) return;

  await getRedisClient().pExpireAt(getMsalCacheKey(sessionId), expiresAt);
}
