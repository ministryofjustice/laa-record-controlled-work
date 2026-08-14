import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const assertInProgressCaseVisible = async (
  page: Page,
  clientName: string,
): Promise<void> => {
  await page.getByRole("link", { name: "In progress" }).click();
  await expect(
    page.getByRole("cell", { name: clientName }).first(),
  ).toBeVisible();
};
