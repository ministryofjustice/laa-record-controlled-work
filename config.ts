import dotenv from 'dotenv';
import type { Config } from '#types/config-types.js';
dotenv.config();

const DEFAULT_RATE_LIMIT_MAX = 100;
const DEFAULT_RATE_WINDOW_MS_MINUTE = 15;
const MILLISECONDS_IN_A_MINUTE = 60000;
const DEFAULT_PORT = 3000;

// Validate required session env vars
if (process.env.SESSION_SECRET == null || process.env.SESSION_SECRET === '' ||
    process.env.SESSION_NAME == null || process.env.SESSION_NAME === '') {
  throw new Error('SESSION_SECRET and SESSION_NAME must be defined in environment variables.');
}

// Get environment variables
const config: Config = {
  CONTACT_EMAIL: process.env.CONTACT_EMAIL,
  CONTACT_PHONE: process.env.CONTACT_PHONE,
  DEPARTMENT_NAME: process.env.DEPARTMENT_NAME,
  DEPARTMENT_URL: process.env.DEPARTMENT_URL,
  RATELIMIT_HEADERS_ENABLED: process.env.RATELIMIT_HEADERS_ENABLED,
  RATELIMIT_STORAGE_URI: process.env.RATELIMIT_STORAGE_URI,
  RATE_LIMIT_MAX: Number(process.env.RATE_LIMIT_MAX ?? DEFAULT_RATE_LIMIT_MAX),
  // Default rate window: 15 minutes in milliseconds
  RATE_WINDOW_MS: Number(process.env.RATE_WINDOW_MS ?? String(DEFAULT_RATE_WINDOW_MS_MINUTE * MILLISECONDS_IN_A_MINUTE)),
  SERVICE_NAME: process.env.SERVICE_NAME,
  SERVICE_PHASE: process.env.SERVICE_PHASE,
  SERVICE_URL: process.env.SERVICE_URL,
  session: {
    secret: process.env.SESSION_SECRET,
    name: process.env.SESSION_NAME,
    resave: false,
    saveUninitialized: false
  },
  app: {
    port: Number(process.env.PORT ?? DEFAULT_PORT),
    environment: process.env.NODE_ENV ?? 'development',
    appName: process.env.SERVICE_NAME ?? 'Your service name',
    useHttps: process.env.NODE_ENV === 'production' // Use HTTPS in production
  },
  csrf: {
    cookieName: '_csrf',
    secure: process.env.NODE_ENV === 'production',  // Only secure in production
    httpOnly: true,  // Restrict client-side access
  },
  paths: {
    static: 'public',  // Path for serving static files
    views: 'src/views',  // Path for Nunjucks views
  }
};

export default config;