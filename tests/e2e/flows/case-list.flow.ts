import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import {
  extractApplicationIdFromTaskListPath,
  isTaskListPath
} from "#tests/e2e/flows/task-list.flow.js";

export const CASE_LIST_URL_PATTERN = new RegExp("/cases$");

const CASES_SEGMENT_INDEX = 1;
const APPLICATION_ID_CAPTURE_GROUP_INDEX = 2;
const VIEW_SEGMENT_INDEX = 3;
const CLIENT_DETAILS_SEGMENT_INDEX = 4;
const EXPECTED_VIEW_PATH_SEGMENT_COUNT = 5;

export const extractApplicationIdFromViewPath = (
  pathname: string,
): string | undefined => {
  const pathSegments = pathname.split("/");

  console.error("Path segments:", pathSegments); // Debugging line to log the path segments
  if (
    pathSegments.length !== EXPECTED_VIEW_PATH_SEGMENT_COUNT ||
    pathSegments[CASES_SEGMENT_INDEX] !== "cases" ||
    pathSegments[VIEW_SEGMENT_INDEX] !== "view" ||
    pathSegments[CLIENT_DETAILS_SEGMENT_INDEX] !== "client-details"
  ) {
    return undefined;
  }

  return pathSegments[APPLICATION_ID_CAPTURE_GROUP_INDEX];
};

export const isCaseListPath = (pathname: string): boolean =>
  pathname === "/cases";

export const gotoCaseList = async (page: Page): Promise<void> => {
  await page.goto("/cases");
  await expect
    .poll(() => isCaseListPath(new URL(page.url()).pathname))
    .toBe(true);
};

export const gotoCase = async (
  page: Page,
  applicationId: string,
): Promise<void> => {
  await page.goto(`/cases/${applicationId}/task-list`);
  await expect
    .poll(() => isTaskListPath(new URL(page.url()).pathname, applicationId))
    .toBe(true);
};

export const openDraftCaseFromCaseList = async (
  page: Page,
  applicationId: string,
): Promise<string> => {
  await gotoCaseList(page);
  await page.getByRole("link", { name: "In progress" }).click();

  const draftCaseLink = page
    .locator(`a[href='/cases/${applicationId}/task-list']`)
    .first();

  await expect(draftCaseLink).toBeVisible();
  await draftCaseLink.click();

  const openedApplicationId = extractApplicationIdFromTaskListPath(
    new URL(page.url()).pathname,
  );

  if (openedApplicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return openedApplicationId;
};

export const openRecordedCaseFromCaseList = async (
  page: Page,
  applicationId: string,
): Promise<string> => {
  await gotoCaseList(page);
  await page.getByRole("link", { name: "Recorded" }).click();

  const recordedCaseLink = page
    .locator(`a[href='/cases/${applicationId}/view']`)
    .first();

  await expect(recordedCaseLink).toBeVisible();
  await recordedCaseLink.click();

  const openedApplicationId = extractApplicationIdFromViewPath(
    new URL(page.url()).pathname,
  );

  if (openedApplicationId === undefined) {
    throw new Error("Failed to extract application ID from view URL");
  }

  return openedApplicationId;
};
