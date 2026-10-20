import type { Question } from "#/export/sections/meansAssessment/answers/answers.types.js";

import { formatGBP } from "#/lib/currency.js";
import { fixedT, t } from "#/lib/i18n.js";

const meansAssessment = {
  t: fixedT("pages.export.meansAssessment"),
};

/**
 * Formats a declared saved answer as translated plain text.
 * @param question The domain-local question definition.
 * @param answerContext Data used by this question to select its answer.
 * @param index The unchanged saved answer-set index.
 * @returns The answer's display value without normalising saved values.
 */
export function formatAnswer<TAnswerContext>(
  question: Question<TAnswerContext>,
  answerContext: TAnswerContext,
  index: number,
): string {
  // We use generic question type narrowing so that
  // the value returned by `question.select` is correctly typed for each question kind.
  switch (question.kind) {
    case "boolean": {
      const value = question.select(answerContext, index);
      return value ? t("common.yes") : t("common.no");
    }
    case "choice":
    case "frequency": {
      const value = question.select(answerContext, index);
      if (value === null || value === undefined) {
        return question.kind === "choice"
          ? t("pages.export.notProvided")
          : meansAssessment.t("notApplicable");
      }
      return meansAssessment.t(question.choices[value]);
    }
    case "gbp":
    case "percentage": {
      const value = question.select(answerContext, index);
      if (value === null || value === undefined) {
        return meansAssessment.t("notApplicable");
      }
      return question.kind === "gbp" ? formatGBP(value) : `${String(value)}%`;
    }
    case "text": {
      const value = question.select(answerContext, index);
      return value ?? meansAssessment.t("notApplicable");
    }
  }
}
