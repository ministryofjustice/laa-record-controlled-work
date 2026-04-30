import { createRedisClient, createRedisStore } from "#/lib/redis.js";
import type { Config } from "#/types/config-types.js";
import type { RedisStore } from "connect-redis";
import type { RequestHandler } from "express";
import session from "express-session";

/**
 * Express middleware to set up session store instance
 * if redis is not enabled will default to MemoryStore
 * @param config config
 * @returns - Promise of a Requesr Handler
 */
export async function sessionMiddleWare(
  config: Config,
): Promise<RequestHandler> {
  if (config.redis.enabled) {
    const client = createRedisClient(config.redis);
    const store: RedisStore = await createRedisStore(client);

    return session({
      ...config.session,
      store,
    });
  }

  console.log("Using MemoryStore (not suitable for production environments)");
  return session({
    ...config.session,
  });
}
