import "dotenv/config";

import type { SessionOptions } from "express-session";

import type {
  ApiConfig,
  AppConfig,
  Config,
  CsrfConfig,
  EntraConfig,
  RedisConfig,
} from "#/config.types.js";

import { HOUR, MINUTE, SECOND } from "#/lib/constants/time.js";
import { optional, required } from "#/lib/env.js";
import { resolveApiMode } from "#/lib/resolveApiMode.js";

const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_PORT = 3000;
const REDIS_MAX_RETRY_ATTEMPTS = 10;
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = "localhost";
const DEFAULT_RCW_API_BASE_URL = "http://localhost:8081";
const DEFAULT_PDA_API_BASE_URL =
  "https://laa-provider-details-api-uat.apps.live.cloud-platform.service.justice.gov.uk";
const DEFAULT_PDA_MSW_OFFICE_COUNT = 3;
const DEFAULT_ENTRA_APPLICATIONS_READ_SCOPE =
  "https://devlexternal.onmicrosoft.com/laa-record-controlled-work-api-uat/Applications.Read";

/* eslint-disable @typescript-eslint/no-magic-numbers -- time constants are intuitive */
const REDIS_SOCKET_CONNECTION_TIMEOUT = 10 * SECOND;
const SESSION_AGE_MAX = 12 * HOUR;
const DEFAULT_RATE_WINDOW = 15 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

const DEPLOYED_ENVIRONMENTS = ["production", "staging", "uat"];
const useHttps =
  optional.USE_HTTPS ?? DEPLOYED_ENVIRONMENTS.includes(required.NODE_ENV);

export default {
  api: {
    pda: {
      baseUrl: optional.PDA_API_BASE_URL ?? DEFAULT_PDA_API_BASE_URL,
      key: required.PDA_API_KEY,
      mode: resolveApiMode(optional.PDA_API_MODE, optional.API_MODE),
      mswOfficeCount:
        optional.PDA_MSW_OFFICE_COUNT ?? DEFAULT_PDA_MSW_OFFICE_COUNT,
    },
    rcw: {
      baseUrl: optional.RCW_API_BASE_URL ?? DEFAULT_RCW_API_BASE_URL,
      mode: resolveApiMode(optional.RCW_API_MODE, optional.API_MODE),
    },
    useMockAccessToken: required.NODE_ENV === "test",
  } satisfies ApiConfig,

  app: {
    contact: {
      email: optional.CONTACT_EMAIL,
      phone: optional.CONTACT_PHONE,
    },
    department: {
      name: optional.DEPARTMENT_NAME ?? "Legal Aid Agency",
      url: optional.DEPARTMENT_URL,
    },
    environment: required.NODE_ENV,
    paths: {
      static: "public",
    },
    port: optional.PORT ?? DEFAULT_PORT,
    rateLimit: {
      authMax: optional.AUTH_RATE_LIMIT_MAX ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
      enabled:
        optional.RATE_LIMIT_ENABLED !== undefined
          ? optional.RATE_LIMIT_ENABLED === "true"
          : required.NODE_ENV !== "docker",
      headersEnabled: optional.RATELIMIT_HEADERS_ENABLED,
      max: optional.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX,
      storageUri: optional.RATELIMIT_STORAGE_URI,
      windowMs: optional.RATE_WINDOW_MS ?? DEFAULT_RATE_WINDOW,
    },
    service: {
      name: optional.SERVICE_NAME ?? "Record Controlled Work",
      phase: optional.SERVICE_PHASE,
      url: optional.SERVICE_URL,
    },
  } satisfies AppConfig,

  csrf: {
    cookieName: "_csrf",
    httpOnly: true,
    secure: useHttps,
  } satisfies CsrfConfig,

  entra: {
    authority: `${required.ENTRA_AUTHORITY_BASE_URL}${required.ENTRA_TENANT_ID}`,
    clientId: required.ENTRA_CLIENT_ID,
    clientSecret: required.ENTRA_CLIENT_SECRET,
    redirectUri: required.ENTRA_REDIRECT_URI,
    scopes: [
      "openid",
      "profile",
      "offline_access",

      ...(optional.ENTRA_ADDITIONAL_SCOPES ?? [
        DEFAULT_ENTRA_APPLICATIONS_READ_SCOPE,
      ]),
    ],
  } satisfies EntraConfig,

  redis: {
    enabled: optional.REDIS_ENABLED === "true",
    maxAge: Math.ceil(SESSION_AGE_MAX / SECOND),
    maxRetryAttempts: REDIS_MAX_RETRY_ATTEMPTS,
    socketConnectionTimeout: REDIS_SOCKET_CONNECTION_TIMEOUT,
    url:
      optional.REDIS_URL ??
      `redis://${DEFAULT_REDIS_HOST}:${DEFAULT_REDIS_PORT}`,
  } satisfies RedisConfig,

  session: {
    cookie: {
      httpOnly: true,
      maxAge: SESSION_AGE_MAX,
      sameSite: "lax",
      secure: useHttps || "auto",
    },
    name: useHttps ? "__Host-rcw.sid" : "rcw.sid",
    resave: false,
    saveUninitialized: false,
    secret: required.SESSION_SECRET,
  } satisfies SessionOptions,
} satisfies Config;
