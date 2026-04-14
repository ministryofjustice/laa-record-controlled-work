/**
 * Entra Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to Entra (Microsoft Identity Platform) and serve mock responses.
 *
 * The token endpoint handler is the only one needed — MSAL has login.microsoftonline.com
 * hardcoded so it never calls the OIDC discovery or instance discovery endpoints.
 */

import { http, HttpResponse } from "msw";
import { ENTRA_TEST_CONFIG } from "../../playwright.config.js";

const { TENANT_ID, CLIENT_ID, CLOUD_INSTANCE } = ENTRA_TEST_CONFIG;
const AUTHORITY_BASE = `${CLOUD_INSTANCE}${TENANT_ID}`;

// MSAL only base64-decodes the payload to read claims — it never verifies the
// signature on tokens received from the token endpoint (back-channel, over TLS).
// A structurally valid JWT with a placeholder signature is sufficient.
function createMockIdToken(): string {
  const now = Math.floor(Date.now() / 1000);

  const payload = Buffer.from(
    JSON.stringify({
      aud: CLIENT_ID,
      iss: `${AUTHORITY_BASE}/v2.0`,
      iat: now,
      nbf: now,
      exp: now + 3600,
      sub: "test-user-id",
      oid: "test-user-oid",
      name: "Test User",
      preferred_username: "testuser@example.com",
      tid: TENANT_ID,
    }),
  ).toString("base64url");

  return `placeholder.${payload}.placeholder`;
}

export const entraHandlers = [
  // Token endpoint — called by MSAL's acquireTokenByCode when exchanging the auth code.
  // MSAL has login.microsoftonline.com hardcoded in both its instance discovery metadata
  // and endpoint metadata, so no network calls are made for authority resolution —
  // this is the only Entra endpoint MSAL actually hits during the code exchange.
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
        JSON.stringify({ uid: "test-user-oid", utid: TENANT_ID }),
      ).toString("base64url"),
    });
  }),
];
