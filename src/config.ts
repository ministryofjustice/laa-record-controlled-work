import "dotenv/config";

import type {
  AppConfig,
  Config,
  CsrfConfig,
  EntraConfig,
  ExpressSessionConfig,
  PathsConfig,
  RedisConfig,
} from "#/types/config-types.js";
import { HOUR, MINUTE, SECOND } from "#/lib/constants/time.js";
import { optional, required } from "#/lib/env.js";

const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_PORT = 3000;
const REDIS_MAX_RETRY_ATTEMPTS = 10;
const DEFAULT_REDIS_PORT = 6379;

/* eslint-disable @typescript-eslint/no-magic-numbers -- time constants are intuitive */
const REDIS_SOCKET_CONNECTION_TIMEOUT = 10 * SECOND;
const SESSION_AGE_MAX = 18 * HOUR;
const DEFAULT_RATE_WINDOW = 15 * MINUTE;
/* eslint-enable @typescript-eslint/no-magic-numbers */

export default {
  CONTACT_EMAIL: optional.CONTACT_EMAIL,
  CONTACT_PHONE: optional.CONTACT_PHONE,
  DEPARTMENT_NAME: optional.DEPARTMENT_NAME,
  DEPARTMENT_URL: optional.DEPARTMENT_URL,

  RATELIMIT_HEADERS_ENABLED: optional.RATELIMIT_HEADERS_ENABLED,
  RATELIMIT_STORAGE_URI: optional.RATELIMIT_STORAGE_URI,

  SERVICE_NAME: optional.SERVICE_NAME,
  SERVICE_PHASE: optional.SERVICE_PHASE,
  SERVICE_URL: optional.SERVICE_URL,

  AUTH_RATE_LIMIT_MAX:
    optional.AUTH_RATE_LIMIT_MAX ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
  RATE_LIMIT_MAX: optional.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX,
  RATE_WINDOW_MS: optional.RATE_WINDOW_MS ?? DEFAULT_RATE_WINDOW,

  app: {
    port: optional.PORT ?? DEFAULT_PORT,
    environment: optional.NODE_ENV ?? "development",
    appName: optional.SERVICE_NAME ?? "Your service name",
    useHttps: optional.NODE_ENV === "production", // Use HTTPS in production
  } satisfies AppConfig,

  expressSession: {
    secret: required.SESSION_SECRET,

    redisUrl: optional.REDIS_URL ?? "redis://localhost:6379",
    name: "__Host-rcw-sid",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      maxAge: SESSION_AGE_MAX,
    },
  } satisfies ExpressSessionConfig,

  redis: {
    authToken: optional.REDIS_AUTH_TOKEN,
    host: optional.REDIS_HOST ?? "localhost",
    port: optional.REDIS_PORT ?? DEFAULT_REDIS_PORT,
    enabled: optional.REDIS_ENABLED === "true",
    url: optional.REDIS_URL ?? "redis://localhost:6379",

    socketConnectionTimeout: REDIS_SOCKET_CONNECTION_TIMEOUT,
    maxRetryAttempts: REDIS_MAX_RETRY_ATTEMPTS,
  } satisfies RedisConfig,

  csrf: {
    secure: optional.NODE_ENV === "production", // Only secure in production
    cookieName: "_csrf",
    httpOnly: true, // Restrict client-side access
  } satisfies CsrfConfig,

  paths: {
    static: "public", // Path for serving static files
    views: "src/views", // Path for Nunjucks views
  } satisfies PathsConfig,

  entra: {
    clientId: required.ENTRA_CLIENT_ID,
    clientSecret: required.ENTRA_CLIENT_SECRET,
    authority: `${required.ENTRA_AUTHORITY_BASE_URL}${required.ENTRA_TENANT_ID}`,
    authorityBaseUrl: required.ENTRA_AUTHORITY_BASE_URL,
    tenantId: required.ENTRA_TENANT_ID,
    redirectUri: required.ENTRA_REDIRECT_URI,
    postLogoutRedirectUri: required.ENTRA_POST_LOGOUT_REDIRECT_URI,
  } satisfies EntraConfig,
} satisfies Config;
