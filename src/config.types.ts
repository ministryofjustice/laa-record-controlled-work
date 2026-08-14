import type { SessionOptions } from "express-session";

import type { ApiMode } from "#/lib/resolveApiMode.js";

export interface ApiConfig {
  pda: {
    baseUrl: string;
    key: string;
    mode: ApiMode;
    mswOfficeCount: number;
  };
  rcw: {
    baseUrl: string;
    mode: ApiMode;
  };
  useMockAccessToken: boolean;
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
    enabled: boolean;
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
