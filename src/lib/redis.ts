import { RedisStore } from "connect-redis";
import { createClient } from "redis";

import type { RedisConfig } from "#/config.types.js";

import { SECOND } from "./constants/time.js";

export type RedisClientFactory = (options: RedisConfig) => RedisClientType;
export type RedisClientType = ReturnType<typeof createClient>;

/**
 * Create and configure Redis client
 * @param  config - Redis configuration from environment variables
 * @returns Configured Redis client
 */
export const createRedisClient = (config: RedisConfig): RedisClientType => {
  console.log("Connecting to Redis at, ", config.url);

  const client = createClient({
    socket: {
      connectTimeout: config.socketConnectionTimeout,
      reconnectStrategy: (retries: number) => {
        if (retries > config.maxRetryAttempts) {
          console.error(
            `Redis reconnection failed after ${config.maxRetryAttempts} attempts`,
          );
          return new Error("Redis reconnection limit exceeded");
        }
        // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- time values are intuitive here
        const delay = Math.min(retries * (SECOND / 10), 3 * SECOND);
        console.log(
          `Redis reconnecting... attempt ${retries}, waiting ${delay}ms`,
        );
        return delay;
      },
    },
    url: config.url,
  });

  client.on("error", (err) => {
    console.error("Redis Client Error: ", err);
  });

  client.on("connect", () => {
    console.log("Redis client connecting...");
  });

  client.on("ready", () => {
    console.log("Redis client ready");
  });

  client.on("reconnecting", () => {
    console.log("Redis client reconnecting...");
  });

  client.on("end", () => {
    console.log("Redis client disconnected");
  });

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
