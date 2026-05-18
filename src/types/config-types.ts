// Configuration type definitions

import type { SessionOptions } from "express-session";

export interface AppConfig {
  appName: string;
  environment: string;
  port: number;
  useHttps: boolean;
  // Add any other app configuration properties
}

export interface Config {
  app: AppConfig;
  AUTH_RATE_LIMIT_MAX: number;
  CONTACT_EMAIL: string | undefined;
  CONTACT_PHONE: string | undefined;
  csrf: CsrfConfig;
  DEPARTMENT_NAME: string | undefined;
  DEPARTMENT_URL: string | undefined;
  entra: EntraConfig;
  paths: PathsConfig;
  RATE_LIMIT_MAX: number;
  RATE_WINDOW_MS: number;
  RATELIMIT_HEADERS_ENABLED: string | undefined;
  RATELIMIT_STORAGE_URI: string | undefined;
  redis: RedisConfig;
  SERVICE_NAME: string | undefined;
  SERVICE_PHASE: string | undefined;
  SERVICE_URL: string | undefined;
  session: SessionOptions;
}

export interface CsrfConfig {
  cookieName: string;
  httpOnly: boolean;
  secure: boolean;
}

export interface EntraConfig {
  authority: string;
  authorityBaseUrl: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  tenantId: string;
}

export interface PathsConfig {
  static: string;
  views: string;
}

export interface RedisConfig {
  enabled: boolean;
  maxRetryAttempts: number;
  socketConnectionTimeout: number;
  url: string;
}
