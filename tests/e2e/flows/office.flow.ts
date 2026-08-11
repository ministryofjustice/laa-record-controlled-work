import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import { pagePathname } from "./auth.flow.js";

export const ensureOfficeSelected = async (page: Page): Promise<void> => {
  if (pagePathname(page.url()).startsWith("/select-office")) {
    await page.getByRole("radio").first().check();
    await page.getByRole("button", { name: "Continue" }).click();
  }

  if (!pagePathname(page.url()).startsWith("/cases")) {
    await page.goto("/cases");
  }

  await expect(page).toHaveURL(/\/cases\/?$/);
};
