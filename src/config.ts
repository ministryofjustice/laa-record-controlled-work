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

const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_PORT = 3000;
const REDIS_MAX_RETRY_ATTEMPTS = 10;
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = "localhost";
const DEFAULT_RCW_API_BASE_URL = "http://localhost:8081";
const DEFAULT_PDA_API_BASE_URL = "http://localhost:8081";
const DEFAULT_API_MODE = "msw";
const ENTRA_APPLICATIONS_READ_SCOPE =
  "https://devlexternal.onmicrosoft.com/laa-record-controlled-work-api-uat/Applications.Read";

/* eslint-disable @typescript-eslint/no-magic-numbers -- time constants are intuitive */
const REDIS_SOCKET_CONNECTION_TIMEOUT = 10 * SECOND;
const SESSION_AGE_MAX = 12 * HOUR;
const DEFAULT_RATE_WINDOW = 15 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

const useHttps = ["production", "staging", "uat"].includes(required.NODE_ENV);

export default {
  api: {
    mode: optional.API_MODE ?? DEFAULT_API_MODE,
    pda: {
      baseUrl: optional.PDA_API_BASE_URL ?? DEFAULT_PDA_API_BASE_URL,
      key: required.PDA_API_KEY,
      spec: {
        host: optional.GH_HOST ?? "github.com",
        path:
          optional.PDA_API_SPEC_PATH ??
          "providers-api/open-api-specification.yml",
        ref: optional.PDA_API_SPEC_REF ?? "v1.51.0",
        repo:
          optional.PDA_API_REPOSITORY ??
          "ministryofjustice/laa-data-provider-data",
      },
    },
    rcw: {
      baseUrl: optional.RCW_API_BASE_URL ?? DEFAULT_RCW_API_BASE_URL,
    },
    useMockAccessToken: required.NODE_ENV === "test",
  } satisfies ApiConfig,

  app: {
    contact: {
      email: optional.CONTACT_EMAIL,
      phone: optional.CONTACT_PHONE,
    },
    department: {
      name: optional.DEPARTMENT_NAME,
      url: optional.DEPARTMENT_URL,
    },
    environment: required.NODE_ENV,
    paths: {
      static: "public",
    },
    port: optional.PORT ?? DEFAULT_PORT,
    rateLimit: {
      authMax: optional.AUTH_RATE_LIMIT_MAX ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
      headersEnabled: optional.RATELIMIT_HEADERS_ENABLED,
      max: optional.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX,
      storageUri: optional.RATELIMIT_STORAGE_URI,
      windowMs: optional.RATE_WINDOW_MS ?? DEFAULT_RATE_WINDOW,
    },
    service: {
      name: optional.SERVICE_NAME ?? "LAA Record Controlled Work",
      phase: optional.SERVICE_PHASE,
      url: optional.SERVICE_URL,
    },
    useHttps,
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
      ENTRA_APPLICATIONS_READ_SCOPE,
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
