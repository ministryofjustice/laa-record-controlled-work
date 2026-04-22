import type { Config } from "#types/config-types.js";
import dotenv from "dotenv";
dotenv.config();

// TODO verify appropriate max rate limit for auth routes
const DEFAULT_AUTH_RATE_LIMIT_MAX = 20;
const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_RATE_WINDOW_MS_MINUTE = 15;
const MILLISECONDS_IN_A_MINUTE = 60000;
const DEFAULT_PORT = 3000;

// Validate required session env vars
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET must be defined in environment variables.");
}
if (!process.env.SESSION_NAME) {
  throw new Error("SESSION_NAME must be defined in environment variables.");
}
if (!process.env.ENTRA_CLIENT_ID) {
  throw new Error("ENTRA_CLIENT_ID must be defined in environment variables.");
}
if (!process.env.ENTRA_CLIENT_SECRET) {
  throw new Error(
    "ENTRA_CLIENT_SECRET must be defined in environment variables.",
  );
}
if (!process.env.ENTRA_TENANT_ID) {
  throw new Error("ENTRA_TENANT_ID must be defined in environment variables.");
}
if (!process.env.ENTRA_REDIRECT_URI) {
  throw new Error(
    "ENTRA_REDIRECT_URI must be defined in environment variables.",
  );
}
if (!process.env.ENTRA_AUTHORITY_BASE_URL) {
  throw new Error(
    "ENTRA_AUTHORITY_BASE_URL must be defined in environment variables.",
  );
}
if (!process.env.ENTRA_POST_LOGOUT_REDIRECT_URI) {
  throw new Error(
    "ENTRA_POST_LOGOUT_REDIRECT_URI must be defined in environment variables.",
  );
}

// Get environment variables
const config: Config = {
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  CONTACT_PHONE: process.env.CONTACT_PHONE,
  DEPARTMENT_NAME: process.env.DEPARTMENT_NAME,
  DEPARTMENT_URL: process.env.DEPARTMENT_URL,
  RATELIMIT_HEADERS_ENABLED: process.env.RATELIMIT_HEADERS_ENABLED,
  RATELIMIT_STORAGE_URI: process.env.RATELIMIT_STORAGE_URI,
  AUTH_RATE_LIMIT_MAX: Number(
    process.env.AUTH_RATE_LIMIT_MAX ?? DEFAULT_AUTH_RATE_LIMIT_MAX,
  ),
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX),
  // Default rate window: 15 minutes in milliseconds
  RATE_WINDOW_MS: Number(
    process.env.RATE_WINDOW_MS ??
      String(DEFAULT_RATE_WINDOW_MS_MINUTE * MILLISECONDS_IN_A_MINUTE),
  ),
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_PHASE: process.env.SERVICE_PHASE,
  SERVICE_URL: process.env.SERVICE_URL,
  REDIS_URL: process.env.REDIS_URL,
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: false,
  },
  app: {
    port: Number(process.env.PORT ?? DEFAULT_PORT),
    environment: process.env.NODE_ENV ?? "development",
    appName: process.env.SERVICE_NAME ?? "Your service name",
    useHttps: process.env.NODE_ENV === "production", // Use HTTPS in production
  },
  csrf: {
    cookieName: "_csrf",
    secure: process.env.NODE_ENV === "production", // Only secure in production
    httpOnly: true, // Restrict client-side access
  },
  paths: {
    static: "public", // Path for serving static files
    views: "src/views", // Path for Nunjucks views
  },
  entra: {
    clientId: process.env.ENTRA_CLIENT_ID,
    clientSecret: process.env.ENTRA_CLIENT_SECRET,
    authority: `${process.env.ENTRA_AUTHORITY_BASE_URL}/${process.env.ENTRA_TENANT_ID}`,
    authorityBaseUrl: process.env.ENTRA_AUTHORITY_BASE_URL,
    tenantId: process.env.ENTRA_TENANT_ID,
    redirectUri: process.env.ENTRA_REDIRECT_URI,
    postLogoutRedirectUri: process.env.ENTRA_POST_LOGOUT_REDIRECT_URI,
  },
};

export default config;
