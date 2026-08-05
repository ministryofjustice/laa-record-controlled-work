import { ConfidentialClientApplication, ProtocolMode } from "@azure/msal-node";

import config from "#/config.js";

const ENTRA_AUTHORITY_HOST = "login.microsoftonline.com";

const authorityHost = new URL(config.entra.authority).host;
const isEntraAuthority =
  authorityHost === ENTRA_AUTHORITY_HOST ||
  authorityHost.endsWith(`.${ENTRA_AUTHORITY_HOST}`);

export const msalConfig = {
  auth: {
    authority: config.entra.authority,
    clientId: config.entra.clientId,
    clientSecret: config.entra.clientSecret,
    // Non-Entra authorities (e.g. mock-oauth2-server, used for local Docker sign-in) need
    // explicit OIDC discovery - MSAL otherwise assumes an Azure AD authority.
    ...(isEntraAuthority ? {} : { knownAuthorities: [authorityHost] }),
  },
  ...(isEntraAuthority ? {} : { system: { protocolMode: ProtocolMode.OIDC } }),
};

export const scopes: string[] = config.entra.scopes;
export const authRequestDefaults = {
  prompt: "select_account",
  redirectUri: config.entra.redirectUri,
  responseMode: "query",
  scopes,
} as const;

export const msalClient: ConfidentialClientApplication =
  new ConfidentialClientApplication(msalConfig);
