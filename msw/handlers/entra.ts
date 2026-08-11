import { http, HttpResponse } from "msw";
import { ENTRA_TEST_CONFIG } from "../../tests/playwright/playwright.config.js";

const { ENTRA_TENANT_ID, ENTRA_CLIENT_ID, ENTRA_AUTHORITY_BASE_URL } =
  ENTRA_TEST_CONFIG;
const AUTHORITY_BASE = `${ENTRA_AUTHORITY_BASE_URL}${ENTRA_TENANT_ID}`;

// MSAL only base64-decodes the payload to read claims — it never verifies the
// signature on tokens received from the token endpoint (back-channel, over TLS).
// A structurally valid JWT with a placeholder signature is sufficient.
function createMockIdToken(): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = Buffer.from(
    JSON.stringify({
      aud: ENTRA_CLIENT_ID,
      iss: `${AUTHORITY_BASE}/v2.0`,
      iat: now,
      nbf: now,
      exp: now + 3600,
      sub: "test-user-id",
      oid: "test-user-oid",
      name: "Test User",
      preferred_username: "testuser@example.com",
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
      token_type: "Bearer",
      scope: "openid profile",
      expires_in: 3600,
      ext_expires_in: 3600,
      not_before: now,
      access_token: "mock-access-token",
      id_token: createMockIdToken(),
      // client_info is a base64url-encoded JSON used by MSAL to build account info.
      client_info: Buffer.from(
        JSON.stringify({ uid: "test-user-oid", utid: ENTRA_TENANT_ID }),
      ).toString("base64url"),
    });
  }),
];
