import { ConfidentialClientApplication } from "@azure/msal-node";

import config from "#/config.js";

export const msalConfig = {
  auth: {
    authority: config.entra.authority,
    clientId: config.entra.clientId,
    clientSecret: config.entra.clientSecret,
  },
};

export const scopes: string[] = ["openid", "profile"];
export const authRequestDefaults = {
  prompt: "select_account",
  redirectUri: config.entra.redirectUri,
  responseMode: "form_post",
  scopes,
} as const;

export const msalClient: ConfidentialClientApplication =
  new ConfidentialClientApplication(msalConfig);
