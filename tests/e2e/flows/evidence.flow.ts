import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const completeEvidenceYesPath = async (
  _page: Page,
  _applicationId: string,
): Promise<void> => {
  await Promise.reject(
    new Error("completeEvidenceYesPath is not implemented in Phase 2"),
  );
};

export const completeEvidenceNoPath = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/evidence/have-evidence`);

  await page.getByRole("radio", { name: "No" }).check();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(
    `/cases/${applicationId}/evidence/reason-for-no-evidence`,
  );

  await page
    .getByRole("radio", {
      name: "It's not possible to get it before starting the work",
    })
    .check();

  await page
    .getByRole("textbox", { name: "Give more details" })
    .fill("Some details");

  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page).toHaveURL(
    `/cases/${applicationId}/evidence/check-answers`,
  );

  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(`/cases/${applicationId}/task-list`);
};
