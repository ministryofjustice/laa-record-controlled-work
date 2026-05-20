import "dotenv/config";

import "#/lib/zodExtensions.js";

import type { SessionOptions } from "express-session";

import type {
  AppConfig,
  Config,
  CsrfConfig,
  EntraConfig,
  PathsConfig,
  RedisConfig,
} from "#/types/config-types.js";

import { MINUTE, SECOND } from "#/lib/constants/time.js";
import { optional, required } from "#/lib/env.js";

const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_PORT = 3000;
const REDIS_MAX_RETRY_ATTEMPTS = 10;
const DEFAULT_REDIS_PORT = 6379;
const DEFAULT_REDIS_HOST = "localhost";

/* eslint-disable @typescript-eslint/no-magic-numbers -- time constants are intuitive */
const REDIS_SOCKET_CONNECTION_TIMEOUT = 10 * SECOND;
// const SESSION_AGE_MAX = 18 * HOUR;
const DEFAULT_RATE_WINDOW = 15 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

const useHttps = ["production", "staging", "uat"].includes(required.NODE_ENV);

export default {
  app: {
    appName: optional.SERVICE_NAME ?? "Your service name",
    environment: required.NODE_ENV,
    port: optional.PORT ?? DEFAULT_PORT,
    useHttps, // Use HTTPS in production
  } satisfies AppConfig,
  AUTH_RATE_LIMIT_MAX:
    optional.AUTH_RATE_LIMIT_MAX ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
  CONTACT_EMAIL: optional.CONTACT_EMAIL,
  CONTACT_PHONE: optional.CONTACT_PHONE,

  csrf: {
    cookieName: "_csrf",
    httpOnly: true, // Restrict client-side access
    secure: useHttps, // Only secure in production
  } satisfies CsrfConfig,
  DEPARTMENT_NAME: optional.DEPARTMENT_NAME,

  DEPARTMENT_URL: optional.DEPARTMENT_URL,
  entra: {
    authority: `${required.ENTRA_AUTHORITY_BASE_URL}${required.ENTRA_TENANT_ID}`,
    authorityBaseUrl: required.ENTRA_AUTHORITY_BASE_URL,
    clientId: required.ENTRA_CLIENT_ID,
    clientSecret: required.ENTRA_CLIENT_SECRET,
    postLogoutRedirectUri: required.ENTRA_POST_LOGOUT_REDIRECT_URI,
    redirectUri: required.ENTRA_REDIRECT_URI,
    tenantId: required.ENTRA_TENANT_ID,
  } satisfies EntraConfig,
  paths: {
    static: "public", // Path for serving static files
    views: "src/views", // Path for Nunjucks views
  } satisfies PathsConfig,

  RATE_LIMIT_MAX: optional.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX,
  RATE_WINDOW_MS: optional.RATE_WINDOW_MS ?? DEFAULT_RATE_WINDOW,
  RATELIMIT_HEADERS_ENABLED: optional.RATELIMIT_HEADERS_ENABLED,

  RATELIMIT_STORAGE_URI: optional.RATELIMIT_STORAGE_URI,

  redis: {
    enabled: optional.REDIS_ENABLED === "true",
    maxRetryAttempts: REDIS_MAX_RETRY_ATTEMPTS,

    socketConnectionTimeout: REDIS_SOCKET_CONNECTION_TIMEOUT,
    url:
      optional.REDIS_URL ??
      `redis://${DEFAULT_REDIS_HOST}:${DEFAULT_REDIS_PORT}`,
  } satisfies RedisConfig,

  SERVICE_NAME: optional.SERVICE_NAME,

  SERVICE_PHASE: optional.SERVICE_PHASE,

  SERVICE_URL: optional.SERVICE_URL,

  session: {
    name: "rcw.sid",
    resave: false,
    saveUninitialized: false,
    secret: required.SESSION_SECRET,
    // TODO: this requires an auth refactor to use entra response_mode=query
    // cookie: {
    //   secure: useHttps,
    //   httpOnly: true,
    //   sameSite: "lax",
    //   maxAge: SESSION_AGE_MAX,
    // },
  } satisfies SessionOptions,
} satisfies Config;
