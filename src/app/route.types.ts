import { z } from "zod";

export const ApplicationIdParam = z.object({
  applicationId: z.uuid(),
});

export type ApplicationIdParam = z.infer<typeof ApplicationIdParam>;
