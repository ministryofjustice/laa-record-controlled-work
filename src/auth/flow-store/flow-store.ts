import type {
  AuthFlowStore,
  AuthFlowStoreOptions,
} from "#/auth/flow-store/flow-store.types.js";

import { createMemoryAuthFlowStore } from "#/auth/flow-store/memory.store.js";
import { createRedisAuthFlowStore } from "#/auth/flow-store/redis.store.js";
import config from "#/config.js";
import { getRedisClient } from "#/lib/redis.js";

export type {
  AuthFlow,
  AuthFlowReservation,
  AuthFlowStore,
} from "#/auth/flow-store/flow-store.types.js";

const MEMORY_ENVIRONMENTS = new Set(["development", "docker", "test"]);

/** Creates Redis storage or permitted local in-memory storage.
 * @param options - Optional clock and Redis-client overrides.
 * @returns A flow store for the configured environment.
 */
export function createAuthFlowStore(
  options: AuthFlowStoreOptions = {},
): AuthFlowStore {
  if (config.redis.enabled) {
    return createRedisAuthFlowStore(options.redisClient ?? getRedisClient());
  }
  if (!MEMORY_ENVIRONMENTS.has(config.app.environment)) {
    throw new Error("Redis is required for authentication flow storage");
  }
  return createMemoryAuthFlowStore(options.now ?? Date.now);
}

let authFlowStore: AuthFlowStore | undefined;

/** Returns the process-wide auth-flow store instance.
 * @returns The cached flow-store instance.
 */
export function getAuthFlowStore(): AuthFlowStore {
  authFlowStore ??= createAuthFlowStore();
  return authFlowStore;
}
