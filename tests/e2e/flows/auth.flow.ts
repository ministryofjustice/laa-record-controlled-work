import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

const MOCK_OAUTH_SIGNIN_PATH = "https://localhost:9090/default/authorize";
const MOCK_USERNAME = process.env.E2E_MOCK_USERNAME ?? "test.user@example.com";
const SIGN_IN_TIMEOUT_MS = 30000;
const RCW_ENTRY_PATHS = new Set(["/cases", "/select-office"]);

export const pagePathname = (urlString: string): string =>
  new URL(urlString).pathname;

const isRcwEntryPath = (pathname: string): boolean =>
  RCW_ENTRY_PATHS.has(pathname);

const completeAuthorizeIfPresent = async (page: Page): Promise<void> => {
  const currentUrl = page.url();
  const currentPathname = pagePathname(currentUrl);

  if (
    currentUrl.startsWith(MOCK_OAUTH_SIGNIN_PATH) ||
    currentPathname === "/default/authorize"
  ) {
    await page.locator("#username").fill(MOCK_USERNAME);
    await page.getByRole("button", { name: "Sign-in" }).click();
  }
};

export const signInWithMockOAuth = async (page: Page): Promise<void> => {
  await page.goto("/auth/signin");
  await completeAuthorizeIfPresent(page);

  await page.goto("/cases");
  await completeAuthorizeIfPresent(page);

  await expect
    .poll(() => isRcwEntryPath(pagePathname(page.url())), {
      message: "Expected to reach RCW after mock OAuth sign-in",
      timeout: SIGN_IN_TIMEOUT_MS,
    })
    .toBe(true);
};
