import { createClient } from "redis";
import { SECOND } from "./constants/time.js";
import type { RedisConfig } from "#/types/config-types.js";
import type { RedisClientType } from "#/types/redis.js";

/**
 * Create and configure Redis client
 * @param  config - Redis configuration from environment variables
 * @returns Configured Redis client
 */
export const createRedisClient = (config: RedisConfig): RedisClientType => {
  console.log("Connecting to Redis at, ", config.url);

  const client = createClient({
    url: config.url,
    password: config.authToken,
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
