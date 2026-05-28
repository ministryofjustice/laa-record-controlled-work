/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import { z } from "zod";

export const authCodeResponseSchema = z.object({
  code: z.string().min(1),
  session_state: z.string().optional(),
  state: z.string().min(1),
});
export type AuthCodeResponse = z.infer<typeof authCodeResponseSchema>;

export interface PKCECodes {
  challenge: string;
  challengeMethod: string;
  verifier: string;
}
