import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { JourneySession } from "#/journeys/context.type.js";

import { InvalidSessionError } from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

/**
 * Gets the journey session from the given context, logging and throwing if it is missing or not a journey session.
 * @param context The effect function context to read the session from.
 * @returns The validated journey session.
 */
export function getSessionData<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TAnswers extends Record<string, unknown> = Record<string, unknown>,
  TSession = unknown,
>(context: EffectFunctionContext<TData, TAnswers, TSession>): JourneySession {
  const session = context.getSession();

  if (!isJourneySession(session)) {
    logger.error("Missing session");
    throw new InvalidSessionError();
  }

  return session;
}

/**
 * Checks whether the given value has the shape of an Express `Session` (used by `JourneySession`).
 * @param value The value to check.
 * @returns True if the value is a journey session.
 */
function isJourneySession(value: unknown): value is JourneySession {
  return typeof value === "object" && value !== null;
}
