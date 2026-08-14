import { http, HttpResponse } from "msw";

import config from "#/config.js";

const AUTHORITY_BASE = config.entra.authority;
const ENTRA_CLIENT_ID = config.entra.clientId;
const ENTRA_TENANT_ID =
  AUTHORITY_BASE.split("/").filter(Boolean).pop() ?? "tenant";

const MILLISECONDS_PER_SECOND = 1000;
const TOKEN_EXPIRY_SECONDS = 3600;

// MSAL only base64-decodes the payload to read claims — it never verifies the
// signature on tokens received from the token endpoint (back-channel, over TLS).
// A structurally valid JWT with a placeholder signature is sufficient.
/**
 * Creates a structurally valid mock ID token payload for MSAL tests.
 * @returns A mock JWT string with placeholder header/signature and valid claims.
 */
function createMockIdToken(): string {
  const now = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);

  const payload = Buffer.from(
    JSON.stringify({
      aud: ENTRA_CLIENT_ID,
      exp: now + TOKEN_EXPIRY_SECONDS,
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
    const now = Math.floor(Date.now() / MILLISECONDS_PER_SECOND);
    return HttpResponse.json({
      access_token: "mock-access-token",
      // client_info is a base64url-encoded JSON used by MSAL to build account info.
      client_info: Buffer.from(
        JSON.stringify({ uid: "test-user-oid", utid: ENTRA_TENANT_ID }),
      ).toString("base64url"),
      expires_in: TOKEN_EXPIRY_SECONDS,
      ext_expires_in: TOKEN_EXPIRY_SECONDS,
      id_token: createMockIdToken(),
      not_before: now,
      scope: "openid profile",
      token_type: "Bearer",
    });
  }),
];
