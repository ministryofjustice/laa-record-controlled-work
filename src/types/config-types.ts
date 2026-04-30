// Configuration type definitions

import type { SessionOptions } from "express-session";

export interface AppConfig {
  port: number;
  environment: string;
  appName: string;
  useHttps: boolean;
  // Add any other app configuration properties
}

export interface CsrfConfig {
  cookieName: string;
  secure: boolean;
  httpOnly: boolean;
}

export interface EntraConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
  authority: string;
  postLogoutRedirectUri: string;
  authorityBaseUrl: string;
}

export interface RedisConfig {
  host: string;
  enabled: boolean;
  authToken?: string;
  port?: number;
  url: string;
  socketConnectionTimeout: number;
  maxRetryAttempts: number;
}

export interface PathsConfig {
  static: string;
  views: string;
}

export interface Config {
  CONTACT_EMAIL: string | undefined;
  CONTACT_PHONE: string | undefined;
  DEPARTMENT_NAME: string | undefined;
  DEPARTMENT_URL: string | undefined;
  RATELIMIT_HEADERS_ENABLED: string | undefined;
  RATELIMIT_STORAGE_URI: string | undefined;
  AUTH_RATE_LIMIT_MAX: number;
  RATE_LIMIT_MAX: number;
  RATE_WINDOW_MS: number;
  SERVICE_NAME: string | undefined;
  SERVICE_PHASE: string | undefined;
  SERVICE_URL: string | undefined;
  app: AppConfig;
  redis: RedisConfig;
  csrf: CsrfConfig;
  session: SessionOptions;
  paths: PathsConfig;
  entra: EntraConfig;
}
