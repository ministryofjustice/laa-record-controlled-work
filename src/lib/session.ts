import type { RedisStore } from "connect-redis";
import type { SessionOptions } from "express-session";
import type { RedisClientType } from "redis";

import type { Config, RedisConfig } from "#/config.types.js";

export type CreateRedisClient = (options: RedisConfig) => RedisClientType;
export type CreateRedisStore = (client: RedisClientType) => Promise<RedisStore>;

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
  createRedisClient: CreateRedisClient,
  createRedisStore: CreateRedisStore,
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
