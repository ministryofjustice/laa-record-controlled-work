import { expect, test } from "../../fixtures/index.js";
import {
  completeApplication,
} from "../../msw/fixtures/rcw.fixtures.js";

test("Edit Application - Client details journey", async ({
  withSelectedOffice: page,
}) => {
  const applicationId = completeApplication.id;

  // ==========================================================================
  // Task list page
  // ==========================================================================

  // Navigate to the task-list page using the application ID from fixtures
  await page.goto(`/cases/${applicationId}/task-list`);

  // Click the client details link
  await page.click(`a[href$="/cases/${applicationId}/edit-client-details/?destination=check-answers"]`);

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
      completeApplication.clientDetails.firstName,
      // Last name
      completeApplication.clientDetails.lastName,
      // Date of birth
      new Date(completeApplication.clientDetails.dateOfBirth).toLocaleDateString(
        "en-GB",
        { day: "numeric", month: "long", year: "numeric" },
      ),
      // National insurance number
      completeApplication.clientDetails.niNumber ?? "",
      // Address
      completeApplication.clientDetails.address?.addressLine1 ?? "",
    ],
    { useInnerText: true },
  );

  const changeAddressLink = rows
    .filter({ has: page.getByText("Address", { exact: true }) })
    .locator(".govuk-summary-list__actions a");
  await expect(changeAddressLink).toHaveAttribute(
    "href",
    "enter-overseas-address?returnTo=check-answers",
  );
  await changeAddressLink.click();

  // Verify redirection back to the overseas address entry page
  await expect(page).toHaveURL(
    `/cases/${applicationId}/edit-client-details/enter-overseas-address?returnTo=check-answers`,
  );
});
