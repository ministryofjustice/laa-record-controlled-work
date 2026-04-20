import config from "#config.js";
import type { Configuration } from "@azure/msal-node";

export const msalConfig: Configuration = {
  auth: {
    clientId: config.entra.clientId,
    authority: config.entra.authority,
    clientSecret: config.entra.clientSecret,
  },
};

export const authScopes: string[] = ["openid", "profile"];
