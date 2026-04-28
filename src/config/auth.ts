import config from "#/config.js";
import type { Configuration } from "@azure/msal-node";

export const msalConfig: Configuration = {
  auth: {
    clientId: config.entra.clientId,
    authority: config.entra.authority,
    clientSecret: config.entra.clientSecret,
  },
};

export const scopes: string[] = ["openid", "profile"];
export const authRequestDefaults = {
  responseMode: "form_post",
  prompt: "select_account",
  scopes,
  redirectUri: config.entra.redirectUri,
} as const;
