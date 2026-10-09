import type { RedisClientType } from "redis";

import { createHash, randomUUID } from "node:crypto";

import type {
  AuthFlow,
  AuthFlowReservation,
  AuthFlowStore,
  StoreResult,
} from "#/auth/flow-store/flow-store.types.js";

import { AUTH_FLOW_LIFETIME } from "#/auth/flow-store/auth.flow.js";
import {
  decodeAuthFlowReservation,
  decodeConsumedAuthFlow,
  decodeRedisSuccess,
} from "#/auth/flow-store/redis.codec.js";
import {
  ABANDON_SCRIPT,
  AUTHORIZE_SCRIPT,
  CONSUME_SCRIPT,
  PUBLISH_SCRIPT,
  RESERVE_SCRIPT,
} from "#/auth/flow-store/redis.scripts.js";
import { type Either, failure, success } from "#/lib/either.js";

const AUTH_FLOW_KEY_PREFIX = "auth-flow:v1:";

const asError = (error: unknown): Error =>
  error instanceof Error ? error : new Error("Auth flow store failed");

const getAuthFlowKey = (sessionId: string): string => {
  const sessionHash = createHash("sha256").update(sessionId).digest("hex");
  return `${AUTH_FLOW_KEY_PREFIX}${sessionHash}`;
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

/** Creates a Redis-backed auth-flow store.
 * @param client - The Redis client used by the store.
 * @returns A Redis-backed auth-flow store.
 */
export function createRedisAuthFlowStore(
  client: RedisClientType,
): AuthFlowStore {
  return {
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
        decode: decodeRedisSuccess,
        script: AUTHORIZE_SCRIPT,
        sessionId,
      }),
    consume: (sessionId, authState): StoreResult<AuthFlow | undefined> =>
      runRedis({
        args: [authState],
        client,
        decode: decodeConsumedAuthFlow,
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
        decode: decodeRedisSuccess,
        script: PUBLISH_SCRIPT,
        sessionId,
      }),
    reserve: (sessionId): StoreResult<AuthFlowReservation> => {
      const reservationId = randomUUID();
      return runRedis({
        args: [reservationId, String(AUTH_FLOW_LIFETIME)],
        client,
        decode: (result) => decodeAuthFlowReservation(result, reservationId),
        script: RESERVE_SCRIPT,
        sessionId,
      });
    },
  };
}
