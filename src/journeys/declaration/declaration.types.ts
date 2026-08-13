import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { AnswerKey as A } from "#/journeys/AnswerKey.js";
import type { JourneySession } from "#/journeys/context.type.js";

export interface DeclarationAnswers extends Record<string, unknown> {
  [A.DECLARATION_SIGNED_CONFIRM]?: string;
  [A.DECLARATION_SIGNED_DATE]?: string;
}

export type DeclarationContext = EffectFunctionContext<
  DeclarationData,
  DeclarationAnswers,
  JourneySession // a reusable type set in root journey.types
>;

export interface DeclarationData extends Record<string, unknown> {}

export interface DeclarationDeps {
  // TODO Not the real deps, just stopping TS from complaining.
  getApplication: typeof getApplication;
}
