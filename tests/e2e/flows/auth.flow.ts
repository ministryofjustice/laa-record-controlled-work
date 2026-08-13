import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export type E2EAuthMode = "entra" | "mock";

const MOCK_OAUTH_SIGNIN_PATH = "https://localhost:9090/default/authorize";
const MOCK_USERNAME = process.env.E2E_MOCK_USERNAME ?? "test.user@example.com";
const SIGN_IN_TIMEOUT_MS = 30000;
const RCW_ENTRY_PATHS = new Set(["/", "/cases", "/select-office"]);
const DEFAULT_MULTI_OFFICE_CODES = ["R1XEVG", "VGHVEY", "3TVRNM"];
const DEFAULT_FIRM_CODE = 123456;
const JSON_INDENT = 2;
const FIRST_INDEX = 0;

const resolveAuthMode = (): E2EAuthMode => {
  const authMode = (process.env.E2E_AUTH_MODE ?? "mock").toLowerCase();

  if (authMode === "mock" || authMode === "entra") {
    return authMode;
  }

  throw new Error(
    `Unsupported E2E_AUTH_MODE '${authMode}'. Expected 'mock' or 'entra'.`,
  );
};

export const AUTH_MODE = resolveAuthMode();

export interface MockOAuthClaims {
  [claim: string]: unknown;
  APP_ROLES: string;
  aud: string;
  FIRM_CODE: number;
  FIRM_NAME: string;
  LAA_ACCOUNTS: string[];
  name: string;
  preferred_username: string;
  scp: string;
  USER_EMAIL: string;
  USER_NAME: string;
}

export interface MockOAuthSignInOptions {
  claims?: Partial<MockOAuthClaims>;
  username?: string;
}

export const DEFAULT_MOCK_OAUTH_CLAIMS: MockOAuthClaims = {
  APP_ROLES: "Record Controlled Work User",
  aud: "default",
  FIRM_CODE: DEFAULT_FIRM_CODE,
  FIRM_NAME: "Test Legal Aid Firm Ltd",
  LAA_ACCOUNTS: DEFAULT_MULTI_OFFICE_CODES,
  name: "Test User",
  preferred_username: MOCK_USERNAME,
  scp: "Applications.Read Applications.Write",
  USER_EMAIL: MOCK_USERNAME,
  USER_NAME: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
};

export const pagePathname = (urlString: string): string =>
  new URL(urlString).pathname;

const isRcwEntryPath = (pathname: string): boolean =>
  RCW_ENTRY_PATHS.has(pathname);

const isMockAuthMode = (): boolean => AUTH_MODE === "mock";

const signInWithNonMockOAuth = async (page: Page): Promise<void> => {
  void page;
  await Promise.resolve();

  throw new Error(
    "Non-mock sign-in is not implemented yet. " +
      "Use E2E_AUTH_MODE=mock or provide a future non-mock sign-in implementation.",
  );
};

const buildClaimsForSignIn = (
  username: string,
  claimsOverrides?: Partial<MockOAuthClaims>,
): MockOAuthClaims => {
  const claims = {
    ...DEFAULT_MOCK_OAUTH_CLAIMS,
    ...claimsOverrides,
  };

  if (claimsOverrides?.USER_EMAIL === undefined) {
    claims.USER_EMAIL = username;
  }

  if (claimsOverrides?.preferred_username === undefined) {
    claims.preferred_username = username;
  }

  return claims;
};

const completeAuthorizeIfPresent = async (
  page: Page,
  options?: MockOAuthSignInOptions,
): Promise<void> => {
  const currentUrl = page.url();
  const currentPathname = pagePathname(currentUrl);

  if (
    currentUrl.startsWith(MOCK_OAUTH_SIGNIN_PATH) ||
    currentPathname === "/default/authorize"
  ) {
    const username = options?.username ?? MOCK_USERNAME;
    const claims = buildClaimsForSignIn(username, options?.claims);

    await page.locator("#username").fill(username);
    await page
      .locator("#claims")
      .fill(JSON.stringify(claims, null, JSON_INDENT));
    await page.getByRole("button", { name: "Sign-in" }).click();
  }
};

export const signInWithMockOAuth = async (
  page: Page,
  options?: MockOAuthSignInOptions,
): Promise<void> => {
  await page.goto("/auth/signin");
  await completeAuthorizeIfPresent(page, options);

  await page.goto("/cases");
  await completeAuthorizeIfPresent(page, options);

  await expect
    .poll(() => isRcwEntryPath(pagePathname(page.url())), {
      message: "Expected to reach RCW after mock OAuth sign-in",
      timeout: SIGN_IN_TIMEOUT_MS,
    })
    .toBe(true);
};

export const signIn = async (page: Page): Promise<void> => {
  if (isMockAuthMode()) {
    await signInWithMockOAuth(page);
    return;
  }

  await signInWithNonMockOAuth(page);
};

export const signInWithSingleOfficeMockOAuth = async (
  page: Page,
  officeCode = DEFAULT_MULTI_OFFICE_CODES[FIRST_INDEX],
): Promise<void> => {
  await signInWithMockOAuth(page, {
    claims: {
      LAA_ACCOUNTS: [officeCode],
    },
  });
};

export const signInWithMultiOfficeMockOAuth = async (
  page: Page,
  officeCodes = DEFAULT_MULTI_OFFICE_CODES,
): Promise<void> => {
  await signInWithMockOAuth(page, {
    claims: {
      LAA_ACCOUNTS: officeCodes,
    },
  });
};

const signInWithSingleOfficeNonMock = async (
  page: Page,
  officeCode: string,
): Promise<void> => {
  void page;
  void officeCode;
  await Promise.resolve();

  throw new Error(
    "signInWithSingleOffice is not implemented for non-mock auth yet. " +
      "Use E2E_AUTH_MODE=mock for office-claim-driven journeys.",
  );
};

const signInWithMultiOfficeNonMock = async (
  page: Page,
  officeCodes: string[],
): Promise<void> => {
  void page;
  void officeCodes;
  await Promise.resolve();

  throw new Error(
    "signInWithMultiOffice is not implemented for non-mock auth yet. " +
      "Use E2E_AUTH_MODE=mock for office-claim-driven journeys.",
  );
};

export const signInWithSingleOffice = async (
  page: Page,
  officeCode = DEFAULT_MULTI_OFFICE_CODES[FIRST_INDEX],
): Promise<void> => {
  if (isMockAuthMode()) {
    await signInWithSingleOfficeMockOAuth(page, officeCode);
    return;
  }

  await signInWithSingleOfficeNonMock(page, officeCode);
};

export const signInWithMultiOffice = async (
  page: Page,
  officeCodes = DEFAULT_MULTI_OFFICE_CODES,
): Promise<void> => {
  if (isMockAuthMode()) {
    await signInWithMultiOfficeMockOAuth(page, officeCodes);
    return;
  }

  await signInWithMultiOfficeNonMock(page, officeCodes);
};
