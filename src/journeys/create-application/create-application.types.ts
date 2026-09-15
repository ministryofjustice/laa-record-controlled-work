import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { createApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface CreateApplicationAnswers extends Record<string, unknown> {}

export type CreateApplicationContext = EffectFunctionContext<
  CreateApplicationData,
  CreateApplicationAnswers,
  JourneySession
>;

export interface CreateApplicationData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.applicationID]: string;
}

export interface CreateApplicationEffectsDeps {
  createApplication: typeof createApplication;
}
