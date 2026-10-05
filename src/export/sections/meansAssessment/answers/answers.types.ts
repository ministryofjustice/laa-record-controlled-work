import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

export interface MeansAssessmentAnswerSummary {
  heading: string;
  rows: MeansAssessmentAnswerSummaryRow[];
}

export interface MeansAssessmentAnswerSummaryRow {
  key: string;
  value: string;
}

export type Question<TAnswerContext> = QuestionFormat<TAnswerContext> &
  QuestionMetadata<TAnswerContext>;

export interface QuestionSection<TAnswerContext> {
  /** Each context produces one section containing all questions. */
  answerContexts: (answers: EligibilityData) => readonly TAnswerContext[];
  heading: string;
  isRelevant?: (answers: EligibilityData) => boolean;
  questions: ReadonlyArray<Question<TAnswerContext>>;
}

type AnswerSelector<TAnswerContext, TValue> = (
  answerContext: TAnswerContext,
  index: number,
) => TValue;

interface BooleanQuestionFormat<TAnswerContext> {
  kind: "boolean";
  select: AnswerSelector<TAnswerContext, boolean>;
}

interface ChoiceQuestionFormat<TAnswerContext> {
  choices: Readonly<Record<string, string>>;
  kind: "choice" | "frequency";
  select: AnswerSelector<TAnswerContext, string>;
}

interface NumericQuestionFormat<TAnswerContext> {
  kind: "gbp" | "percentage";
  select: AnswerSelector<TAnswerContext, number>;
}

type QuestionFormat<TAnswerContext> =
  | BooleanQuestionFormat<TAnswerContext>
  | ChoiceQuestionFormat<TAnswerContext>
  | NumericQuestionFormat<TAnswerContext>
  | TextQuestionFormat<TAnswerContext>;

interface QuestionMetadata<TAnswerContext> {
  isRelevant?: (
    answers: EligibilityData,
    answerContext: TAnswerContext,
    index: number,
  ) => boolean;
  label: string;
}

interface TextQuestionFormat<TAnswerContext> {
  kind: "text";
  select: AnswerSelector<TAnswerContext, string>;
}
