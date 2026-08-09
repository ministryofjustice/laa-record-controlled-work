import { z } from "zod";

export const SaveRequestBody = z.object({
  eligibility_assessment: z.looseObject({}),
  resource_id: z.uuid(),
});

export type SaveRequestBody = z.infer<typeof SaveRequestBody>;
