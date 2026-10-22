import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";
import type { RedisClientType } from "redis";

import { getMsalCacheKey } from "#/auth/msal.cache-key.js";

const NO_EXPIRATION_TIMESTAMP = 0;

/**
 * MSAL cache plugin that persists the token cache to Redis.
 * Implements the ICachePlugin interface to intercept MSAL cache operations
 * and store the serialized cache blob in Redis keyed by session ID.
 */
export class RedisCachePlugin implements ICachePlugin {
  private readonly key: string;

  /**
   * Creates a RedisCachePlugin instance.
   * @param redisClient - The Redis client instance.
   * @param sessionId - The express-session ID to use as the cache key suffix.
   * @param expiresAt - Optional absolute expiry time in milliseconds.
   */
  constructor(
    private readonly redisClient: RedisClientType,
    sessionId: string,
    private readonly expiresAt?: number,
  ) {
    this.key = getMsalCacheKey(sessionId);
  }

  /**
   * Called by MSAL after it accesses the cache.
   * If the cache has changed, serializes it and stores in Redis with the configured TTL.
   * @param cacheContext - The MSAL token cache context.
   */
  async afterCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
    if (cacheContext.cacheHasChanged) {
      const expiresAt =
        this.expiresAt ?? (await this.redisClient.pExpireTime(this.key));
      if (expiresAt <= NO_EXPIRATION_TIMESTAMP) {
        throw new Error(
          "Cannot persist MSAL cache without an expiring session",
        );
      }

      await this.redisClient.set(
        this.key,
        cacheContext.tokenCache.serialize(),
        { PXAT: expiresAt },
      );
    }
  }

  /**
   * Called by MSAL before it accesses the cache.
   * Retrieves the serialized cache blob from Redis and deserializes it into the cache context.
   * @param cacheContext - The MSAL token cache context.
   */
  async beforeCacheAccess(cacheContext: TokenCacheContext): Promise<void> {
    const cached = await this.redisClient.get(this.key);
    if (cached) {
      cacheContext.tokenCache.deserialize(cached);
      if (this.expiresAt !== undefined) {
        await this.redisClient.pExpireAt(this.key, this.expiresAt);
      }
    }
  }
}
