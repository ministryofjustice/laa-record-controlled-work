import * as zod from "zod";

export const PriorLegalAidEnum = zod.enum([
  "no",
  "yesDifferentMatter",
  "yesSameMatter",
]);

export type PriorLegalAid = zod.infer<typeof PriorLegalAidEnum>;

// Add new recognised scoping questions here as they are needed.
const ScopingQuestionsSchema = zod.object({
  priorLegalAid: PriorLegalAidEnum.optional().catch(undefined),
});

export type ScopingQuestions = zod.infer<typeof ScopingQuestionsSchema>;

/**
 * Reads the recognised scoping question answers from a loose scoping questions blob.
 * @param scopingQuestions Scoping questions returned by the application API.
 * @returns The recognised scoping question answers, ignoring unrecognised or invalid values.
 */
export function parseScopingQuestions(
  scopingQuestions: unknown,
): ScopingQuestions {
  const parsed = ScopingQuestionsSchema.safeParse(scopingQuestions);

  return parsed.success ? parsed.data : {};
}
