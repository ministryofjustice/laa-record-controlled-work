import type { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";

import type { Config } from "#/config.types.js";

import * as redis from "#/lib/redis.js";

/**
 * Express middleware to set up session store instance
 * if redis is not enabled will default to MemoryStore
 * @param config config
 * @param getRedisClient .
 * @param createRedisStore .
 * @returns - Promise of a Requesr Handler
 */
export async function createSession(
  config: Config,
  getRedisClient = redis.getRedisClient,
  createRedisStore = redis.createRedisStore,
): Promise<SessionOptions> {
  if (config.redis.enabled) {
    const store: RedisStore = await createRedisStore(getRedisClient());

    return {
      ...config.session,
      store,
    };
  }

  // TODO: this should be for deployed envs - maybe add a "deployed" config predicate
  if (config.app.environment === "production") {
    throw new Error("Redis expected in production");
  }

  return {
    ...config.session,
  };
}
