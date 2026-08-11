import { http, HttpResponse } from "msw";

const ENTRA_TENANT_ID = process.env.ENTRA_TENANT_ID ?? "test-tenant-id";
const ENTRA_CLIENT_ID =
  process.env.ENTRA_CLIENT_ID ?? "00000000-0000-0000-0000-000000000001";
const ENTRA_AUTHORITY_BASE_URL =
  process.env.ENTRA_AUTHORITY_BASE_URL ??
  "https://login.microsoftonline.com/";
const AUTHORITY_BASE = `${ENTRA_AUTHORITY_BASE_URL}${ENTRA_TENANT_ID}`;

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
      client_info: Buffer.from(
        JSON.stringify({ uid: "test-user-oid", utid: ENTRA_TENANT_ID }),
      ).toString("base64url"),
    });
  }),
];