import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { updateApplicationDeclaration } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { AnswerKey as A } from "#/journeys/AnswerKey.js";
import type { JourneySession } from "#/journeys/context.type.js";

export interface DeclarationAnswers extends Record<string, unknown> {
  [A.DECLARATION_SIGNED_CONFIRM]?: string[];
  [A.DECLARATION_SIGNED_DATE]?: string;
}

export type DeclarationContext = EffectFunctionContext<
  DeclarationData,
  DeclarationAnswers,
  JourneySession
>;

export interface DeclarationData extends Record<string, unknown> {}

export interface DeclarationDeps {
  updateApplicationDeclaration: typeof updateApplicationDeclaration;
}
