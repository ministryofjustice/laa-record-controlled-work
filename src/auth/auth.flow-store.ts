import type { AuthorizationCodeRequest } from "@azure/msal-node";
import type { RedisClientType } from "redis";

import { createHash, randomUUID } from "node:crypto";
import { z } from "zod";

import type {
  AuthFlow,
  AuthFlowReservation,
  AuthFlowStore,
  AuthFlowStoreOptions,
  StoreResult,
} from "#/auth/flow-store/flow-store.types.js";

import { AUTH_FLOW_LIFETIME, toAuthFlow } from "#/auth/flow-store/auth.flow.js";
import { createMemoryAuthFlowStore } from "#/auth/flow-store/memory.store.js";
import config from "#/config.js";
import { type Either, failure, success } from "#/lib/either.js";
import { getRedisClient } from "#/lib/redis.js";

export type {
  AuthFlow,
  AuthFlowReservation,
  AuthFlowStore,
} from "#/auth/flow-store/flow-store.types.js";

const AUTH_FLOW_KEY_PREFIX = "auth-flow:v1:";
const MEMORY_ENVIRONMENTS = new Set(["development", "docker", "test"]);
const REDIS_SUCCESS = 1;

const authCodeRequestSchema = z
  .object({
    code: z.string(),
    codeVerifier: z.string(),
    redirectUri: z.string(),
    scopes: z.array(z.string()),
  })
  .loose()
  .transform((request) => request as AuthorizationCodeRequest);

const authFlowRecordSchema = z.discriminatedUnion("status", [
  z.object({
    expiresAt: z.number().int(),
    reservationId: z.string(),
    status: z.literal("pending"),
  }),
  z.object({
    authCodeRequest: authCodeRequestSchema,
    authState: z.string(),
    expiresAt: z.number().int(),
    reservationId: z.string(),
    returnTo: z.string(),
    status: z.literal("ready"),
  }),
]);

const RESERVE_SCRIPT = `
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local expiresAt = now + tonumber(ARGV[2])
local record = cjson.encode({
  reservationId = ARGV[1],
  expiresAt = expiresAt,
  status = "pending"
})
redis.call("SET", KEYS[1], record, "PXAT", expiresAt)
return tostring(expiresAt)
`;

const PUBLISH_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] or record.status ~= "pending" then return 0 end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return 0
end
record.status = "ready"
record.authState = ARGV[2]
record.authCodeRequest = cjson.decode(ARGV[3])
record.returnTo = ARGV[4]
redis.call("SET", KEYS[1], cjson.encode(record), "PXAT", record.expiresAt)
return 1
`;

const AUTHORIZE_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] or record.status ~= "ready" then return 0 end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return 0
end
return 1
`;

const CONSUME_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return false end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.status ~= "ready" or record.authState ~= ARGV[1] then return false end
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
if now >= tonumber(record.expiresAt) then
  redis.call("DEL", KEYS[1])
  return false
end
redis.call("DEL", KEYS[1])
return recordText
`;

const ABANDON_SCRIPT = `
local recordText = redis.call("GET", KEYS[1])
if not recordText then return 0 end
local ok, record = pcall(cjson.decode, recordText)
if not ok then return redis.error_reply("Invalid auth flow record") end
if record.reservationId ~= ARGV[1] then return 0 end
redis.call("DEL", KEYS[1])
return 1
`;

const createRedisAuthFlowStore = (client: RedisClientType): AuthFlowStore => ({
  abandon: (sessionId, reservationId): StoreResult<void> =>
    runRedis({
      args: [reservationId],
      client,
      decode: () => undefined,
      script: ABANDON_SCRIPT,
      sessionId,
    }),
  authorizeRedirect: (sessionId, reservationId): StoreResult<boolean> =>
    runRedis({
      args: [reservationId],
      client,
      decode: (value) => value === REDIS_SUCCESS,
      script: AUTHORIZE_SCRIPT,
      sessionId,
    }),
  consume: (sessionId, authState): StoreResult<AuthFlow | undefined> =>
    runRedis({
      args: [authState],
      client,
      decode: parseConsumedFlow,
      script: CONSUME_SCRIPT,
      sessionId,
    }),
  publish: (sessionId, reservationId, flow): StoreResult<boolean> =>
    runRedis({
      args: [
        reservationId,
        flow.authState,
        JSON.stringify(flow.authCodeRequest),
        flow.returnTo,
      ],
      client,
      decode: (value) => value === REDIS_SUCCESS,
      script: PUBLISH_SCRIPT,
      sessionId,
    }),
  reserve: (sessionId): StoreResult<AuthFlowReservation> => {
    const reservationId = randomUUID();
    return runRedis({
      args: [reservationId, String(AUTH_FLOW_LIFETIME)],
      client,
      decode: (value) => {
        if (typeof value !== "string" && typeof value !== "number") {
          throw new Error("Auth flow reservation failed");
        }
        const expiresAt = Number(value);
        if (!Number.isSafeInteger(expiresAt)) {
          throw new Error("Auth flow reservation failed");
        }
        return { expiresAt, reservationId };
      },
      script: RESERVE_SCRIPT,
      sessionId,
    });
  },
});

/**
 * Creates Redis storage or permitted local in-memory storage.
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

/**
 * Returns the process-wide auth-flow store instance.
 * @returns The cached flow-store instance.
 */
export function getAuthFlowStore(): AuthFlowStore {
  authFlowStore ??= createAuthFlowStore();
  return authFlowStore;
}

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error("Auth flow store failed");

const getAuthFlowKey = (sessionId: string): string => {
  const sessionHash = createHash("sha256").update(sessionId).digest("hex");
  return `${AUTH_FLOW_KEY_PREFIX}${sessionHash}`;
};

const parseConsumedFlow = (result: unknown): AuthFlow | undefined => {
  if (typeof result !== "string") return undefined;
  const parsed = authFlowRecordSchema.safeParse(JSON.parse(result));
  if (!parsed.success || parsed.data.status !== "ready") {
    throw new Error("Invalid auth flow record");
  }
  return toAuthFlow(parsed.data);
};

interface RedisOperation<Value> {
  args: string[];
  client: RedisClientType;
  decode: (result: unknown) => Value;
  script: string;
  sessionId: string;
}

const runRedis = async <Value>({
  args,
  client,
  decode,
  script,
  sessionId,
}: RedisOperation<Value>): Promise<Either<Error, Value>> => {
  try {
    const result = await client.eval(script, {
      arguments: args,
      keys: [getAuthFlowKey(sessionId)],
    });
    return success(decode(result));
  } catch (error) {
    return failure(asError(error));
  }
};
