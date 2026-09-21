import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";

export const normaliseNiNumber =
  () =>
  (context: EffectFunctionContext): void => {
    const niNumber = context.getAnswer<string>(AnswerKey.niNumber);

    if (typeof niNumber !== "string") {
      return;
    }

    context.setAnswer(
      AnswerKey.niNumber,
      niNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase(),
    );
  };
