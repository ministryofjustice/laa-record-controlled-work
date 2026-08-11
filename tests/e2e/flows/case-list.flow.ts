import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const gotoCaseList = async (page: Page): Promise<void> => {
  await page.goto("/cases");
  await expect(page).toHaveURL(/\/cases\/?$/);
};

export const gotoCase = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/task-list`);
  await expect(page).toHaveURL(
    new RegExp(`/cases/${applicationId}/task-list/?$`),
  );
};

export const assertInProgressCaseVisible = async (
  page: Page,
  clientName: string,
): Promise<void> => {
  await gotoCaseList(page);
  await page.getByRole("tab", { name: "In progress" }).click();
  await expect(page.getByRole("cell", { name: clientName })).toBeVisible();
};
