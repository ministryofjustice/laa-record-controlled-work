/* eslint-disable @typescript-eslint/no-magic-numbers -- Zod schema constraints are self-documenting */
import z from "zod";

const optionalEnvSchema = z.object({
  CONTACT_EMAIL: z.string().optional(),
  CONTACT_PHONE: z.string().optional(),
  DEPARTMENT_NAME: z.string().optional(),
  DEPARTMENT_URL: z.url().optional(),
  RATELIMIT_HEADERS_ENABLED: z.string().optional(),
  RATELIMIT_STORAGE_URI: z.string().optional(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().optional(),
  RATE_LIMIT_MAX: z.coerce.number().optional(),
  RATE_WINDOW_MS: z.coerce.number().optional(),
  SERVICE_NAME: z.string().optional(),
  SERVICE_PHASE: z.string().optional(),
  SERVICE_URL: z.url().optional(),
  PORT: z.coerce.number().optional(),
  NODE_ENV: z.string().optional(),
  REDIS_URL: z.url().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().optional(),
  REDIS_ENABLED: z.string().optional(),
  REDIS_AUTH_TOKEN: z.string().optional(),
});

const injected = z.string().refine((val) => !val.startsWith("op://"), {
  message:
    "Environment variable contains a raw 1Password reference. Ensure you are running the app via 'op run'.",
});

const requiredEnvSchema = z.object({
  SESSION_SECRET: z.string().nonempty(),

  ENTRA_CLIENT_ID: injected.nonempty(),
  ENTRA_CLIENT_SECRET: injected.nonempty(),
  ENTRA_TENANT_ID: injected.nonempty(),
  ENTRA_REDIRECT_URI: injected.nonempty(),
  ENTRA_AUTHORITY_BASE_URL: injected.nonempty(),
  ENTRA_POST_LOGOUT_REDIRECT_URI: injected.nonempty(),
});

const { data, error } = z
  .object({
    required: requiredEnvSchema,
    optional: optionalEnvSchema,
  })
  .safeParse({
    required: process.env,
    optional: process.env,
  });

if (error) {
  console.error(z.prettifyError(error));
  process.exit(1);
}

export const { required, optional } = data;
