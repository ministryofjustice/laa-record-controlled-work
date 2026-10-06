import type { AuthorizationCodeRequest } from "@azure/msal-node";

import { z } from "zod";

import type {
  AuthFlow,
  AuthFlowReservation,
} from "#/auth/flow-store/flow-store.types.js";

import { toAuthFlow } from "#/auth/flow-store/auth.flow.js";

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

/** Decodes a Redis reservation reply.
 * @param result - The raw Redis reply.
 * @param reservationId - The reservation identifier.
 * @returns The public reservation metadata.
 */
export function decodeAuthFlowReservation(
  result: unknown,
  reservationId: string,
): AuthFlowReservation {
  if (typeof result !== "string" && typeof result !== "number") {
    throw new Error("Auth flow reservation failed");
  }
  const expiresAt = Number(result);
  if (!Number.isSafeInteger(expiresAt)) {
    throw new Error("Auth flow reservation failed");
  }
  return { expiresAt, reservationId };
}

/** Decodes a consumed auth-flow record.
 * @param result - The raw Redis reply.
 * @returns The consumed flow, when present.
 */
export function decodeConsumedAuthFlow(result: unknown): AuthFlow | undefined {
  if (typeof result !== "string") return undefined;
  const parsed = authFlowRecordSchema.safeParse(JSON.parse(result));
  if (!parsed.success || parsed.data.status !== "ready") {
    throw new Error("Invalid auth flow record");
  }
  return toAuthFlow(parsed.data);
}

/** Decodes a Redis success reply.
 * @param result - The raw Redis reply.
 * @returns Whether Redis reported success.
 */
export function decodeRedisSuccess(result: unknown): boolean {
  return result === REDIS_SUCCESS;
}
