import type { RedisConfig } from "./config-types.js";
import type { createClient } from "redis";

export type RedisClientType = ReturnType<typeof createClient>;

export type RedisClientFactory = (options: RedisConfig) => RedisClientType;
