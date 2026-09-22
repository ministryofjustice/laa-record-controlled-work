import { expect, test } from "../../fixtures/index.js";
import {
  clientDetailsApplication,
} from "../../msw/fixtures/rcw.fixtures.js";
test("Edit Application - Client details journey", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = clientDetailsApplication.id;
  
  // ==========================================================================
  // Task list page
  // ==========================================================================

  // Navigate to the task-list page using the application ID from fixtures
  await page.goto(`/cases/${applicationId}/task-list`);

  // Click the client details link
  await page.click(`a[href$="/cases/${applicationId}/task-list/details/?destination=check-answers"]`);

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
  await expect(rows).toHaveCount(8);
  await expect(rows.locator(".govuk-summary-list__value")).toContainText(
    [
      // ECF
      "No",
      // Accessed legal aid before
      "No",
      // First name
      clientDetailsApplication.clientDetails.firstName,
      // Last name
      clientDetailsApplication.clientDetails.lastName,
      // Date of birth
      new Date(clientDetailsApplication.clientDetails.dateOfBirth).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
      ),
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
