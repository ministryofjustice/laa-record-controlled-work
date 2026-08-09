import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface EditApplicationAnswers extends Record<string, unknown> {}

export type EditApplicationContext = EffectFunctionContext<
  EditApplicationData,
  EditApplicationAnswers,
  JourneySession
>;

export interface EditApplicationData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.application]: Application;
}

export interface EditApplicationEffectsDeps {
  getApplication: typeof getApplication;
}
