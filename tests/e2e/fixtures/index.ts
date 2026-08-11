import type { Page } from "@playwright/test";

import { test as base, expect } from "@playwright/test";

const MOCK_OAUTH_SIGNIN_PATH = "https://localhost:9090/default/authorize";
const MOCK_USERNAME = process.env.E2E_MOCK_USERNAME ?? "test.user@example.com";
const AUTH_MODE = (process.env.E2E_AUTH_MODE ?? "mock").toLowerCase();
const SIGN_IN_TIMEOUT_MS = 30000;

interface TestFixtures {
  withSelectedOffice: Page;
}

const pagePathname = (urlString: string): string => new URL(urlString).pathname;

const signInWithMockOAuth = async (page: Page): Promise<void> => {
  await page.goto("/");

  if (page.url().startsWith(MOCK_OAUTH_SIGNIN_PATH)) {
    await page.locator("#username").fill(MOCK_USERNAME);
    await page.getByRole("button", { name: "Sign-in" }).click();
  }

  await expect
    .poll(() => pagePathname(page.url()), {
      message: "Expected to reach RCW after mock OAuth sign-in",
      timeout: SIGN_IN_TIMEOUT_MS,
    })
    .toMatch(/^\/(select-office\/?|cases\/?)/);
};

const ensureOfficeSelected = async (page: Page): Promise<void> => {
  if (pagePathname(page.url()).startsWith("/select-office")) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Continue" }).click();
  }

  if (!pagePathname(page.url()).startsWith("/cases")) {
    await page.goto("/cases");
  }

  await expect(page).toHaveURL(/\/cases\/?$/);
};

export { ensureOfficeSelected, signInWithMockOAuth };

export const test = base.extend<TestFixtures>({
  page: async ({ page }, use): Promise<void> => {
    if (AUTH_MODE !== "mock") {
      throw new Error(
        "Unsupported E2E_AUTH_MODE " +
          `'${AUTH_MODE}' in fixtures. ` +
          "Only 'mock' is implemented for Phase 2.",
      );
    }

    await signInWithMockOAuth(page);
    await use(page);
  },

  withSelectedOffice: async ({ page }, use): Promise<void> => {
    await ensureOfficeSelected(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
