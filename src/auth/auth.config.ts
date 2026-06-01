import config from "#/config.js";

export const scopes: string[] = ["openid", "profile"];
export const authRequestDefaults = {
  prompt: "select_account",
  redirectUri: config.entra.redirectUri,
  responseMode: "query",
  scopes,
} as const;
