import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface ViewApplicationAnswers extends Record<string, unknown> {}

export type ViewApplicationContext = EffectFunctionContext<
  ViewApplicationData,
  ViewApplicationAnswers,
  JourneySession
>;

export interface ViewApplicationData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.applicationID]: string;
  [CONTEXT_DATA_KEYS.recordedOn]: Date;
}

export interface ViewApplicationEffectsDeps {
  getApplication: typeof getApplication;
}
