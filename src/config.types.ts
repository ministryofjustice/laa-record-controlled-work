import type { SessionOptions } from "express-session";

export interface ApiConfig {
  baseUrl: string;
  mode: string;
}

export interface AppConfig {
  contact: {
    email: string | undefined;
    phone: string | undefined;
  };
  department: {
    name: string | undefined;
    url: string | undefined;
  };
  environment: string;
  paths: {
    static: string;
  };
  port: number;
  rateLimit: {
    authMax: number | string;
    headersEnabled: string | undefined;
    max: number;
    storageUri: string | undefined;
    windowMs: number;
  };
  service: {
    name: string;
    phase: string | undefined;
    url: string | undefined;
  };
  useHttps: boolean;
}
export interface Config {
  api: ApiConfig;
  app: AppConfig;
  csrf: CsrfConfig;
  entra: EntraConfig;
  redis: RedisConfig;
  session: SessionOptions;
}

export interface CsrfConfig {
  cookieName: string;
  httpOnly: boolean;
  secure: boolean;
}

export interface EntraConfig {
  authority: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface RedisConfig {
  enabled: boolean;
  maxAge: number;
  maxRetryAttempts: number;
  socketConnectionTimeout: number;
  url: string;
}
