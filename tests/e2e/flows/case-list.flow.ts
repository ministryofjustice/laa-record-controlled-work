import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";
import { match } from "path-to-regexp";

import { isTaskListPath } from "#tests/e2e/flows/task-list.flow.js";

export const CASE_LIST_URL_PATTERN = new RegExp("/cases$");

export const extractApplicationIdFromPath = (
  pathPattern: string,
  pathname: string,
): string | undefined => {
  const matcher = match(pathPattern);
  const matched = matcher(pathname);

  if (matched !== false) {
    const applicationId = matched.params.id;
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers -- it's an array
    return Array.isArray(applicationId) ? applicationId[0] : applicationId;
  }
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

  const openedApplicationId = extractApplicationIdFromPath(
    "/cases/:id/task-list",
    new URL(page.url()).pathname,
  );

  if (openedApplicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return openedApplicationId;
};

/**
 * This has been temporarily commented out as the recorded view has been deprioritised.
 */

// export const openRecordedCaseFromCaseList = async (
//   page: Page,
//   applicationId: string,
// ): Promise<string> => {
//   await gotoCaseList(page);
//   await page.getByRole("link", { name: "Recorded" }).click();

//   const recordedCaseLink = page
//     .locator(`a[href='/cases/${applicationId}/view']`)
//     .first();

//   await expect(recordedCaseLink).toBeVisible();
//   await recordedCaseLink.click();

//   const openedApplicationId = extractApplicationIdFromPath(
//     "/cases/:id/view/client-details",
//     new URL(page.url()).pathname,
//   );

//   if (openedApplicationId === undefined) {
//     throw new Error("Failed to extract application ID from view URL");
//   }

//   return openedApplicationId;
// };
