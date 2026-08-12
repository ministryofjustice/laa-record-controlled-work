import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

const APPLICATION_ID_CAPTURE_GROUP_INDEX = 1;
const SLASH_SEGMENT_INDEX = 0;
const CASES_SEGMENT_INDEX = 1;
const TASK_LIST_SEGMENT_INDEX = 3;
const TRAILING_SLASH_TRIM_INDEX = -1;
const EXPECTED_TASK_LIST_PATH_SEGMENT_COUNT = 4;

export const taskListUrlPattern = (applicationId?: string): RegExp =>
  applicationId === undefined
    ? new RegExp("/cases/[^/]+/task-list/?$")
    : new RegExp(`/cases/${applicationId}/task-list/?$`);

export const trimTrailingSlash = (value: string): string =>
  value.endsWith("/")
    ? value.slice(SLASH_SEGMENT_INDEX, TRAILING_SLASH_TRIM_INDEX)
    : value;

export const isTaskListPath = (
  pathname: string,
  applicationId: string,
): boolean =>
  trimTrailingSlash(pathname) === `/cases/${applicationId}/task-list`;

export const extractApplicationIdFromTaskListPath = (
  pathname: string,
): string | undefined => {
  const normalizedPath = trimTrailingSlash(pathname);
  const pathSegments = normalizedPath.split("/");

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
