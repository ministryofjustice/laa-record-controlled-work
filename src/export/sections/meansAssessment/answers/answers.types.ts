import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";

export type Question<TAnswerContext> = QuestionFormat<TAnswerContext> &
  QuestionMetadata<TAnswerContext>;

export interface QuestionSection<TAnswerContext = EligibilityData> {
  /** Each context produces one section containing all questions. */
  answerContexts: (answers: EligibilityData) => readonly TAnswerContext[];
  heading: string;
  questions: ReadonlyArray<Question<TAnswerContext>>;
  relevant?: (answers: EligibilityData) => boolean;
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
  label: string;
  relevant?: QuestionRelevancePredicate<TAnswerContext>;
}

type QuestionRelevancePredicate<TAnswerContext> = (
  answers: EligibilityData,
  answerContext: TAnswerContext,
  index: number,
) => boolean;

interface TextQuestionFormat<TAnswerContext> {
  kind: "text";
  select: AnswerSelector<TAnswerContext, string>;
}
