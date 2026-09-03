import type { Page } from "@playwright/test";

import { expect } from "@playwright/test";

import { extractApplicationIdFromPath } from "#tests/e2e/flows/case-list.flow.js";
import { taskListUrlPattern } from "#tests/e2e/flows/task-list.flow.js";

const clickContinue = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Continue" }).click();
};

export const startNewCase = async (page: Page): Promise<void> => {
  await page.goto("/cases/new/provider-declaration");
};

export const completeCreateCaseShortestPath = async (
  page: Page,
): Promise<string> => {
  await startNewCase(page);

  await expect(page).toHaveURL("/cases/new/provider-declaration");
  await page.getByRole("button", { name: "Agree and continue" }).click();

  // ECF
  await expect(page).toHaveURL("/cases/new/ecf");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/legal-aid-before");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/client-details");
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel("Day").fill("01");
  await page.getByLabel("Month").fill("01");
  await page.getByLabel("Year").fill("1990");
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/ni-number");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/have-a-home-address");
  await page.getByRole("radio", { name: "Yes" }).check();
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/enter-address-manually");
  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("Town or city").fill("Testtown");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await clickContinue(page);

  await expect(page).toHaveURL("/cases/new/check-answers");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(taskListUrlPattern());

  const applicationId = extractApplicationIdFromPath(
    "/cases/:id/task-list",
    new URL(page.url()).pathname,
  );

  if (applicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return applicationId;
};
