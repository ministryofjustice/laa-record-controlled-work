import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

const APPLICATION_ID_CAPTURE_GROUP_INDEX = 2;
const CASES_SEGMENT_INDEX = 1;
const TASK_LIST_SEGMENT_INDEX = 3;
const EXPECTED_TASK_LIST_PATH_SEGMENT_COUNT = 4;

export const taskListUrlPattern = (applicationId?: string): RegExp =>
  applicationId === undefined
    ? new RegExp("/cases/[^/]+/task-list$")
    : new RegExp(`/cases/${applicationId}/task-list$`);

export const isTaskListPath = (
  pathname: string,
  applicationId: string,
): boolean => pathname === `/cases/${applicationId}/task-list`;

export const extractApplicationIdFromTaskListPath = (
  pathname: string,
): string | undefined => {
  const pathSegments = pathname.split("/");

  if (
    pathSegments.length !== EXPECTED_TASK_LIST_PATH_SEGMENT_COUNT ||
    pathSegments[CASES_SEGMENT_INDEX] !== "cases" ||
    pathSegments[TASK_LIST_SEGMENT_INDEX] !== "task-list"
  ) {
    return undefined;
  }

  return pathSegments[APPLICATION_ID_CAPTURE_GROUP_INDEX];
};

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
