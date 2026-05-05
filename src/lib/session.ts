import * as redis from "#/lib/redis.js";
import type { Config } from "#/types/config-types.js";
import type { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";

/**
 * Express middleware to set up session store instance
 * if redis is not enabled will default to MemoryStore
 * @param config config
 * @param createRedisClient .
 * @param createRedisStore .
 * @returns - Promise of a Requesr Handler
 */
export async function createSession(
  config: Config,
  createRedisClient = redis.createRedisClient,
  createRedisStore = redis.createRedisStore,
): Promise<SessionOptions> {
  if (config.redis.enabled) {
    const client = createRedisClient(config.redis);
    const store: RedisStore = await createRedisStore(client);

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
