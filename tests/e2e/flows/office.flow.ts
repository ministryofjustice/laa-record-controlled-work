import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import { pagePathname } from "#tests/e2e/flows/auth.flow.js";
import { CASE_LIST_URL_PATTERN } from "#tests/e2e/flows/case-list.flow.js";

export const selectOfficeByCode = async (
  page: Page,
  code: string,
): Promise<void> => {
  if (pagePathname(page.url()).startsWith("/select-office")) {
    await page
      .locator(".govuk-radios__item", { hasText: code })
      .getByRole("radio")
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
  }

  if (!pagePathname(page.url()).startsWith("/cases")) {
    await page.goto("/cases");
  }

  if (pagePathname(page.url()).startsWith("/select-office")) {
    await page
      .locator(".govuk-radios__item", { hasText: code })
      .getByRole("radio")
      .check();
    await page.getByRole("button", { name: "Continue" }).click();
  }
  const TEST = 15000;
  // Selecting an office calls a backend API before redirecting; CI runners under load can be slow
  await expect(page).toHaveURL(CASE_LIST_URL_PATTERN, { timeout: TEST });
};
