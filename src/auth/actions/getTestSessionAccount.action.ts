import type { AccountInfo } from "@azure/msal-node";

import type { KnownClaims } from "#/@types/express-session.js";

const FIRM_CODE = 12345;
const FIRM_NAME = "Test Legal Aid Firm Ltd";
const HOME_ACCOUNT_ID = "test.user@example.com";
const LAA_ACCOUNT = "R1XEVG";
const LAA_ACCOUNTS = ["R1XEVG", "VGHVEY", "3TVRNM"];

/**
 * Get a test session account object for the test login.
 *
 * @returns  Session account object populated with test data.
 */
export function getTestSessionAccount(): AccountInfo & KnownClaims {
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- Milliseconds
  const now = Math.floor(Date.now() / 1000);
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- One hour
  const expiry = now + 3600;

  return {
    authorityType: "Generic",
    environment: "login.microsoftonline.com",
    homeAccountId: HOME_ACCOUNT_ID,
    idToken: "test-id-token",
    idTokenClaims: {
      APP_ROLES: "Record Controlled Work User",
      aud: "default",
      exp: expiry,
      FIRM_CODE,
      FIRM_NAME: "Test Legal Aid Firm Ltd",
      iat: now,
      iss: "https://login.microsoftonline.com/default",
      jti: "7ca8d3cf-26e4-4b7f-840e-64cdbe7f6652",
      LAA_ACCOUNTS,
      name: "Test User",
      nbf: now,
      oid: "test_user",
      preferred_username: "test.user@example.com",
      scp: "Applications.Read Applications.Write",
      sub: "test.user@example.com",
      tid: "test_tenant",
      USER_EMAIL: "test.user@example.com",
      USER_NAME: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    kmsi: false,
    localAccountId: "test_user",
    name: "Test User",
    tenantId: "test_tenant",
    tenantProfiles: new Map(),
    username: "test.user@example.com",
  };
}

export { FIRM_CODE, FIRM_NAME, HOME_ACCOUNT_ID, LAA_ACCOUNT, LAA_ACCOUNTS };
