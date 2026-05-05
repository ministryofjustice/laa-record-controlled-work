import config from "#/config.js";
import { ConfidentialClientApplication } from "@azure/msal-node";

export const msalConfig = {
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

export const msalClient: ConfidentialClientApplication =
  new ConfidentialClientApplication(msalConfig);
