import { http, HttpResponse } from "msw";

import config from "#/config.js";

const AUTHORITY_BASE = config.entra.authority;
const ENTRA_CLIENT_ID = config.entra.clientId;
const ENTRA_TENANT_ID = AUTHORITY_BASE.split("/").at(-1) ?? "tenant";

// MSAL only base64-decodes the payload to read claims — it never verifies the
// signature on tokens received from the token endpoint (back-channel, over TLS).
// A structurally valid JWT with a placeholder signature is sufficient.
/**
 *
 */
function createMockIdToken(): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = Buffer.from(
    JSON.stringify({
      aud: ENTRA_CLIENT_ID,
      exp: now + 3600,
      iat: now,
      iss: `${AUTHORITY_BASE}/v2.0`,
      name: "Test User",
      nbf: now,
      oid: "test-user-oid",
      preferred_username: "testuser@example.com",
      sub: "test-user-id",
      tid: ENTRA_TENANT_ID,
    }),
  ).toString("base64url");

  return `placeholder.${payload}.placeholder`;
}

export const entraHandlers = [
  // Token endpoint — MSAL has login.microsoftonline.com hardcoded, so this is the
  // only Entra endpoint it actually hits during the auth code exchange.
  http.post(`${AUTHORITY_BASE}/oauth2/v2.0/token`, () => {
    const now = Math.floor(Date.now() / 1000);
    return HttpResponse.json({
      access_token: "mock-access-token",
      // client_info is a base64url-encoded JSON used by MSAL to build account info.
      client_info: Buffer.from(
        JSON.stringify({ uid: "test-user-oid", utid: ENTRA_TENANT_ID }),
      ).toString("base64url"),
      expires_in: 3600,
      ext_expires_in: 3600,
      id_token: createMockIdToken(),
      not_before: now,
      scope: "openid profile",
      token_type: "Bearer",
    });
  }),
];
