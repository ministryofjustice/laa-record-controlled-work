import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import type { Session } from "express-session";

export type JourneyEffectContext = EffectFunctionContext<
  Record<string, unknown>,
  Record<string, unknown>,
  JourneySession
>;

/**
 * Journeys use the express session for answer storage. This keeps the examples
 * self-contained with no external dependency on Redis or a database.
 *
 * Each journey owns a key under `session.journeys` so journeys cannot collide.
 */
export type JourneySession = Session & {
  journeyDrafts?: Record<string, Record<string, unknown>>;
  journeySubmitted?: Record<string, boolean>;
};
