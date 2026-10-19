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

/**
 * Progresses through the shortest *private* family law path.
 * @param page  The page instance.
 * @returns  Promise that resolves to the application ID.
 */
export const completeCreateCasePrivateFamilyLawPath = async (
  page: Page,
): Promise<string> => {
  await startNewCase(page);

  // Declaration step.
  await expect(page).toHaveURL("/cases/new/provider-declaration");
  await page.getByRole("button", { name: "Agree and continue" }).click();

  // ECF step.
  await expect(page).toHaveURL("/cases/new/ecf");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  // Type of family law step.
  await expect(page).toHaveURL("/cases/new/family-type-of-case");
  await page.getByRole("radio", { name: "Private" }).check();
  await clickContinue(page);

  // International maintenance agreement step.
  await expect(page).toHaveURL(
    "/cases/new/international-maintenance-agreement",
  );
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  // Protect themself step.
  await expect(page).toHaveURL("/cases/new/protect-themself");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  // Legal aid before step.
  await expect(page).toHaveURL("/cases/new/legal-aid-before");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  // Client details step.
  await expect(page).toHaveURL("/cases/new/client-details");
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("User");
  await page.getByLabel("Day").fill("01");
  await page.getByLabel("Month").fill("01");
  await page.getByLabel("Year").fill("1990");
  await clickContinue(page);

  // National Insurance number step.
  await expect(page).toHaveURL("/cases/new/ni-number");
  await page.getByRole("radio", { name: "No" }).check();
  await clickContinue(page);

  // Address step - do they have an address.
  await expect(page).toHaveURL("/cases/new/have-a-home-address");
  await page.getByRole("radio", { name: "Yes" }).check();
  await clickContinue(page);

  // Address step - enter address.
  await expect(page).toHaveURL("/cases/new/enter-address-manually");
  await page.getByLabel("Address line 1").fill("1 Test Street");
  await page.getByLabel("Town or city").fill("Testtown");
  await page.getByLabel("Postcode").fill("SW1A 1AA");
  await clickContinue(page);

  // Check answers step.
  await expect(page).toHaveURL("/cases/new/check-answers");
  await page.getByRole("button", { name: "Save and continue" }).click();
  await expect(page).toHaveURL(taskListUrlPattern());

  // Get and return the application ID from the completed application.
  const applicationId = extractApplicationIdFromPath(
    "/cases/:id/task-list",
    new URL(page.url()).pathname,
  );

  if (applicationId === undefined) {
    throw new Error("Failed to extract application ID from task-list URL");
  }

  return applicationId;
};
