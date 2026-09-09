import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const completeDeclaration = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/declaration`);
  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/declaration/sign`);

  await page
    .getByRole("checkbox", {
      name: "I confirm that I have a signed declaration from my client",
    })
    .check();
  await page.getByLabel("Day").fill("01");
  await page.getByLabel("Month").fill("01");
  await page.getByLabel("Year").fill("1990");
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/task-list`);
};
