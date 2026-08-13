/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import z from "zod";

import { logger } from "#/logger.js";

const optionalEnvSchema = z.object({
  API_MODE: z.enum(["msw", "api"]).optional(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().optional(),
  CONTACT_EMAIL: z.string().optional(),
  CONTACT_PHONE: z.string().optional(),
  DEPARTMENT_NAME: z.string().optional(),
  DEPARTMENT_URL: z.url().optional(),
  PDA_API_BASE_URL: z.url().optional(),
  PDA_API_MODE: z.enum(["msw", "api"]).optional(),
  PDA_MSW_OFFICE_COUNT: z.coerce.number().optional(),
  PORT: z.coerce.number().optional(),
  RATE_LIMIT_ENABLED: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(["true", "false"]))
    .optional(),
  RATE_LIMIT_MAX: z.coerce.number().optional(),
  RATE_WINDOW_MS: z.coerce.number().optional(),
  RATELIMIT_HEADERS_ENABLED: z.string().optional(),
  RATELIMIT_STORAGE_URI: z.string().optional(),
  RCW_API_BASE_URL: z.url().optional(),
  RCW_API_MODE: z.enum(["msw", "api"]).optional(),
  REDIS_ENABLED: z.string().optional(),
  REDIS_URL: z.url().optional(),
  SERVICE_NAME: z.string().optional(),
  SERVICE_PHASE: z.string().optional(),
  SERVICE_URL: z.url().optional(),
  USE_HTTPS: z
    .string()
    .transform((value) => value.toLowerCase())
    .pipe(z.enum(["true", "false"]))
    .transform((value) => value === "true")
    .optional(),
});

const injected = z.string().refine((val) => !val.startsWith("op://"), {
  message:
    "Environment variable contains a raw 1Password reference. Ensure you are running the app via 'op run'.",
});

const requiredEnvSchema = z.object({
  ENTRA_AUTHORITY_BASE_URL: z.url().nonempty(),
  ENTRA_CLIENT_ID: injected.nonempty(),
  ENTRA_CLIENT_SECRET: injected.nonempty(),
  ENTRA_REDIRECT_URI: z.url().nonempty(),
  ENTRA_TENANT_ID: injected.nonempty(),
  NODE_ENV: z.literal([
    "test",
    "docker",
    "development",
    "uat",
    "staging",
    "production",
  ]),
  PDA_API_KEY: injected.nonempty(),
  SESSION_SECRET: z.string().nonempty(),
});

const { data, error } = z
  .object({
    optional: optionalEnvSchema,
    required: requiredEnvSchema,
  })
  .transform(({ optional, required }) => ({
    optional,
    required,
  }))
  .safeParse({
    optional: process.env,
    required: process.env,
  });

if (error) {
  logger.fatal("Environment validation failed", error, {
    prettyError: z.prettifyError(error),
  });
  process.exit(1);
}

export const { optional, required, useHttps } = data;
