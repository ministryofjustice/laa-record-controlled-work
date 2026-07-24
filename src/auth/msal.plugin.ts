import type { ICachePlugin, TokenCacheContext } from "@azure/msal-node";
import type { RedisClientType } from "redis";

import { getMsalCacheKey } from "#/auth/msal.cache-key.js";

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
   * @param ttlSeconds - The TTL for the Redis key (should match session TTL).
   */
  constructor(
    private readonly redisClient: RedisClientType,
    sessionId: string,
    private readonly ttlSeconds: number,
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
      await this.redisClient.set(
        this.key,
        cacheContext.tokenCache.serialize(),
        {
          EX: this.ttlSeconds,
        },
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
    }
  }
}
