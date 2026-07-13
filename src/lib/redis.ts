import { RedisStore } from "connect-redis";
import { createClient, type RedisClientType } from "redis";

import type { RedisConfig } from "#/config.types.js";

import config from "#/config.js";
import { logger } from "#/logger.js";

import { SECOND } from "./constants/time.js";

// Module-level reference to the active Redis client
let activeRedisClient: null | RedisClientType = null;

/**
 * Returns the active Redis client, creating it on first call.
 * @returns The active Redis client
 */
export function getRedisClient(): RedisClientType {
  activeRedisClient ??= createRedisClient(config.redis);
  return activeRedisClient;
}

/**
 * Create and configure Redis client
 * @param  config - Redis configuration from environment variables
 * @returns Configured Redis client
 */
export const createRedisClient = (config: RedisConfig): RedisClientType => {
  const client = createClient({
    socket: {
      connectTimeout: config.socketConnectionTimeout,
      reconnectStrategy: (retries: number) => {
        if (retries > config.maxRetryAttempts) {
          logger.error(
            "Redis reconnection failed after max attempts",
            undefined,
            {
              maxRetryAttempts: config.maxRetryAttempts,
              retries,
            },
          );
          return new Error("Redis reconnection limit exceeded");
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- time values are intuitive here
        const delay = Math.min(retries * (SECOND / 10), 3 * SECOND);
        logger.info("Redis reconnecting", { delay, retries });
        return delay;
      },
    },
    url: config.url,
  });

  client.on("error", (err) => {
    logger.error("Redis client error", err);
  });

  client.on("connect", () => {
    logger.info("Redis client connecting");
  });

  client.on("ready", () => {
    logger.info("Redis client ready");
  });

  client.on("reconnecting", () => {
    logger.info("Redis client reconnecting");
  });

  client.on("end", () => {
    logger.info("Redis client disconnected");
  });

  activeRedisClient = client;
  return client;
};

/**
 * Connects and creates RedisStore
 * @param  client - Redis client
 * @returns RedisStore
 */
export async function createRedisStore(
  client: RedisClientType,
): Promise<RedisStore> {
  await client.connect();
  return new RedisStore({ client });
}
