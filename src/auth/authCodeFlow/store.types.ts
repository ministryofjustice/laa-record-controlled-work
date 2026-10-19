import type { AuthorizationCodeRequest } from "@azure/msal-node";
import type { RedisClientType } from "redis";

import type { Either } from "#/lib/either.js";

export interface AuthFlow {
  authCodeRequest: AuthorizationCodeRequest;
  authState: string;
  returnTo: string;
}

export interface AuthFlowReservation {
  expiresAt: number;
  reservationId: string;
}

export interface AuthFlowStore {
  abandon: (sessionId: string, reservationId: string) => StoreResult<void>;
  authorizeRedirect: (
    sessionId: string,
    reservationId: string,
  ) => StoreResult<boolean>;
  consume: (
    sessionId: string,
    authState: string,
  ) => StoreResult<AuthFlow | undefined>;
  publish: (
    sessionId: string,
    reservationId: string,
    flow: AuthFlow,
  ) => StoreResult<boolean>;
  reserve: (sessionId: string) => StoreResult<AuthFlowReservation>;
}

export interface AuthFlowStoreOptions {
  now?: () => number;
  redisClient?: RedisClientType;
}

export type StoreResult<Value> =
  Either<Error, Value> | Promise<Either<Error, Value>>;
