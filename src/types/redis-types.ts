import type { createClient } from "redis";

import type { RedisConfig } from "./config-types.js";

export type RedisClientFactory = (options: RedisConfig) => RedisClientType;

export type RedisClientType = ReturnType<typeof createClient>;
