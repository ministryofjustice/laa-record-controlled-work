import type { Locator, Page } from "@playwright/test";

import { expect, test } from "../../fixtures/index.js";
import {
  clientDetailsApplication,
  createClientDetailsTestApplicationId,
} from "#msw/fixtures/rcw.js";

async function answerNoFromSummaryRow(
  page: Page,
  row: Locator,
  checkAnswersPath: string,
): Promise<void> {
  await row.getByRole("link", { name: /Change/ }).click();
  const noRadio = page.getByRole("radio", { name: "No", exact: true });
  await expect(noRadio).not.toBeChecked();
  await noRadio.check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page).toHaveURL(checkAnswersPath);
  await expect(row.locator(".govuk-summary-list__value")).toHaveText("No");
}

test("Edit Application - Client details journey", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = createClientDetailsTestApplicationId();

  // ==========================================================================
  // Task list page
  // ==========================================================================

  // Navigate to the task-list page using the application ID from fixtures
  await page.goto(`/cases/${applicationId}/task-list`);

  // Click the client details link
  await page.click(
    `a[href$="/cases/${applicationId}/task-list/details/?destination=check-answers"]`,
  );

  // ==========================================================================
  // Check answers page
  // ==========================================================================

  // Check for the title
  await expect(
    page.getByRole("heading", {
      name: /Check your answers/,
      level: 1,
    }),
  ).toBeVisible();

  // Check that all answers are displayed correctly
  const summaryList = page.locator(".govuk-summary-list");
  const rows = summaryList.locator(".govuk-summary-list__row");
  await expect(rows).toHaveCount(12);
  await expect(rows.locator(".govuk-summary-list__value")).toContainText(
    [
      // ECF
      "INCOMPLETE",
      // Type of family law
      "Private",
      // Transitional EU arrangements or an international maintenance agreement
      "No",
      // Needs protective injunction
      "No",
      "Evidence of domestic abuse (Schedule 1)",
      // Accessed legal aid before
      "No",
      // First name
      clientDetailsApplication.clientDetails.firstName,
      // Last name
      clientDetailsApplication.clientDetails.lastName,
      // Date of birth
      new Date(
        clientDetailsApplication.clientDetails.dateOfBirth,
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      // National insurance number
      clientDetailsApplication.clientDetails.niNumber ?? "",
      // Address
      clientDetailsApplication.clientDetails.address?.addressLine1 ?? "",
    ],
    { useInnerText: true },
  );

  const changeAddressLink = rows
    .filter({ has: page.getByText("Address", { exact: true }) })
    .locator(".govuk-summary-list__actions a");
  await expect(changeAddressLink).toHaveAttribute(
    "href",
    "enter-address-manually?returnTo=check-answers",
  );
  await changeAddressLink.click();

  // Verify redirection back to the manual address entry page
  await expect(page).toHaveURL(
    `/cases/${applicationId}/task-list/details/enter-address-manually?returnTo=check-answers`,
  );

  // ==========================================================================
  // Update information
  // ==========================================================================

  // Fill in the new address line 1 in the manual address entry form
  await page.getByLabel("Address line 1").fill("10 Changed Street");

  await page.getByRole("button", { name: "Continue" }).click();

  // Verify redirection back to the check answers page
  await expect(page).toHaveURL(
    `/cases/${applicationId}/task-list/details/check-answers`,
  );

  // Verify that the updated address is displayed correctly on the check answers page
  await expect(rows.locator(".govuk-summary-list__value").last()).toContainText(
    "10 Changed Street",
    { useInnerText: true },
  );
});

for (const viewport of [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`Incomplete client details can be corrected at ${viewport.width}px`, async ({
    withSelectedOffice: page,
    browser,
    baseURL,
  }, testInfo) => {
    await page.setViewportSize(viewport);
    const applicationId = createClientDetailsTestApplicationId();
    const path = `/cases/${applicationId}/task-list/details/check-answers`;
    await page.goto(path);
    const rows = page.locator(".govuk-summary-list__row");
    const ecf = rows.filter({ has: page.getByText("ECF", { exact: true }) });
    const injunction = rows.filter({
      has: page.getByText("Legal aid to get a protective injunction order", { exact: true }),
    });
    await expect(ecf.locator(".govuk-tag")).toHaveText("INCOMPLETE");
    await expect(injunction.locator(".govuk-tag")).toHaveText("INCOMPLETE");
    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page).toHaveURL(path);
    await expect(page.locator(".govuk-error-summary")).toContainText(
      "You must complete all required answers to continue",
    );
    await page.screenshot({ path: testInfo.outputPath("incomplete-details.png"), fullPage: true });

    await answerNoFromSummaryRow(page, ecf, path);
    await expect(page.locator(".govuk-error-summary")).toHaveCount(0);

    await answerNoFromSummaryRow(page, injunction, path);
    await expect(page.locator(".govuk-tag").filter({ hasText: "INCOMPLETE" })).toHaveCount(0);

    await rows.filter({ has: page.getByText("Type of family law", { exact: true }) })
      .getByRole("link", { name: /Change/ }).click();
    await page.getByRole("radio", { name: "Public", exact: true }).check();
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(injunction).toHaveCount(0);
    const care = rows.filter({ has: page.locator('a[href="care-proceedings?returnTo=check-answers"]') });
    await expect(care.locator(".govuk-tag")).toHaveText("INCOMPLETE");
    await answerNoFromSummaryRow(page, care, path);
    await expect(page.locator(".govuk-tag").filter({ hasText: "INCOMPLETE" })).toHaveCount(0);

    const nationalInsurance = rows.filter({
      has: page.getByText("National Insurance number", { exact: true }),
    });
    await answerNoFromSummaryRow(page, nationalInsurance, path);

    const address = rows.filter({
      has: page.getByText("Address", { exact: true }),
    });
    await address.getByRole("link", { name: /Change/ }).click();
    await page.getByLabel("Address line 1").fill("10 Changed Street");
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await expect(page).toHaveURL(path);
    await expect(address.locator(".govuk-summary-list__value")).toContainText(
      "10 Changed Street",
    );

    await page.getByRole("button", { name: "Save and continue" }).click();
    await expect(page).toHaveURL(`/cases/${applicationId}/task-list`);

    const freshContext = await browser.newContext({ baseURL });
    try {
      const freshPage = await freshContext.newPage();
      await freshPage.goto("/test/signin");
      await freshPage.goto("/select-office/");
      await freshPage.getByRole("radio").first().check();
      await freshPage.getByRole("button", { name: "Continue" }).click();
      await expect(freshPage).toHaveURL("/");
      await freshPage.goto(`/cases/${applicationId}/task-list`);
      await freshPage.click(
        `a[href$="/cases/${applicationId}/task-list/details/?destination=check-answers"]`,
      );

      const savedRows = freshPage.locator(".govuk-summary-list__row");
      const savedValue = (label: string) =>
        savedRows
          .filter({ has: freshPage.getByText(label, { exact: true }) })
          .locator(".govuk-summary-list__value");
      await expect(savedValue("First name")).toHaveText(
        clientDetailsApplication.clientDetails.firstName,
      );
      await expect(savedValue("National Insurance number")).toHaveText("No");
      await expect(savedValue("Type of family law")).toHaveText("Public");
      await expect(savedValue("Address")).toContainText("10 Changed Street");
      await expect(
        savedRows
          .filter({ has: freshPage.locator('a[href="care-proceedings?returnTo=check-answers"]') })
          .locator(".govuk-summary-list__value"),
      ).toHaveText("No");
    } finally {
      await freshContext.close();
    }
  });
}
