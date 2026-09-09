import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

export const taskListUrlPattern = (applicationId?: string): RegExp =>
  applicationId === undefined
    ? new RegExp("/cases/[^/]+/task-list$")
    : new RegExp(`/cases/${applicationId}/task-list$`);

export const isTaskListPath = (
  pathname: string,
  applicationId: string,
): boolean => pathname === `/cases/${applicationId}/task-list`;

export const openMeansAssessmentFromTaskList = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.getByRole("link", { name: "Income and capital" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/cases/${applicationId}/eligibility(?:/.*)?(?:$|\\?)`),
  );
};

export const submitApplication = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.getByRole("button", { name: "Record controlled work" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/cases/${applicationId}/confirmation`),
  );
};

export const viewCompletedEligibilityAssessment = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.getByRole("link", { name: "View result" }).click();
  await expect(page).toHaveURL(
    new RegExp(`/cases/${applicationId}/eligibility/check-result$`),
  );
};
