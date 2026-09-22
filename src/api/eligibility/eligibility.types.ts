import { z } from "zod";

export const PutEligibilityRequestBody = z.object({
  eligibility_assessment: z.looseObject({}),
});

export type PutEligibilityRequestBody = z.infer<
  typeof PutEligibilityRequestBody
>;
