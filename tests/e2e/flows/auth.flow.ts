import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

const MOCK_OAUTH_SIGNIN_PATH = "https://localhost:9090/default/authorize";
const MOCK_USERNAME = process.env.E2E_MOCK_USERNAME ?? "test.user@example.com";
const SIGN_IN_TIMEOUT_MS = 30000;

export const pagePathname = (urlString: string): string =>
  new URL(urlString).pathname;

export const signInWithMockOAuth = async (page: Page): Promise<void> => {
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
