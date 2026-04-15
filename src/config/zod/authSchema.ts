import { z } from "zod";

export const authCodeResponseSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
  session_state: z.string().optional(),
});

export type AuthCodeResponse = z.infer<typeof authCodeResponseSchema>;

export const authStateSchema = z.object({
  successRedirect: z.string().min(1),
});

export type AuthState = z.infer<typeof authStateSchema>;
