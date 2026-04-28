import { RedisStore } from "connect-redis";
import type session from "express-session";
import type { Config } from "#types/config-types.js";
import { MemoryStore } from "express-session";
import type { RedisClientFactory } from "#types/redis.js";
import { createRedisClient } from "#src/lib/redis.js";

/**
 * Build session configuration
 * @param {Config} config - Base session configuration
 * @param {RedisClientFactory} redisClientFactory - Factory function to create Redis client (for testing/mocking)
 * @returns {Promise<session.SessionOptions>} Configured session options with Redis store
 */
export const buildExpressSessionConfig = async (
  config: Config,
  redisClientFactory: RedisClientFactory = createRedisClient,
): Promise<session.SessionOptions> => {
  if (config.redis.enabled) {
    const client = redisClientFactory(config.redis);

    if (!client.isOpen) await client.connect();

    return {
      ...config.expressSession,
      store: new RedisStore({ client }),
    };
  }

  console.log(
    "Using in-memory session store (not suitable for production environments)",
  );
  return {
    ...config.expressSession,
    store: new MemoryStore(),
  };
};
