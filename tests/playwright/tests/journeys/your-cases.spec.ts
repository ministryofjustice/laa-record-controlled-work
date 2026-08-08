import { test, expect } from "../../fixtures/index.js";
import { applications } from "../../fixtures/rcw.fixtures.js";
import { getMappedOffices } from "../../fixtures/pda.fixtures.js";

const [selectedOffice] = getMappedOffices(1);

test("Your Cases step", async ({ withSelectedOffice: page }) => {
  // Navigate to the Your Cases page
  await page.goto("/cases");

  // Check the title of the page
  await expect(
    page.getByRole("heading", {
      name: /Your cases/,
      level: 1,
    }),
  ).toBeVisible();

  // Check the selected office is displayed using the seeded MSW mock data
  await expect(page.getByText(selectedOffice.address)).toBeVisible();
  await expect(page.getByText(selectedOffice.code)).toBeVisible();

  // Check the button
  await page.getByRole("button", { name: "Record a new case" }).click();

  // Verify redirection to the provider declaration page
  await expect(page).toHaveURL("/cases/new/provider-declaration");

  // Navigate back to the your cases page
  await page.goto("/cases");

  // Check the sub navigation
  const inProgressLink = page.getByRole("link", { name: "In progress" });
  const recordedLink = page.getByRole("link", { name: "Recorded" });
  const ineligibleLink = page.getByRole("link", { name: "Ineligible" });

  // Check in progress link navigates to correct page and links have correct aria-current attribute
  await inProgressLink.click();
  await expect(page).toHaveURL("/cases");
  await expect(inProgressLink).toHaveAttribute("aria-current", "page");
  await expect(recordedLink).not.toHaveAttribute("aria-current", "page");
  await expect(ineligibleLink).not.toHaveAttribute("aria-current", "page");

  // Check recorded link navigates to the correct page
  await recordedLink.click();
  await expect(page).toHaveURL("/cases/recorded");

  // Check ineligible link navigates to the correct page
  await ineligibleLink.click();
  await expect(page).toHaveURL("/cases/ineligible");

  // Navigate back to the Your Cases page
  await page.goto("/cases");

  // Check the table renders mock data correctly
  const table = page.getByRole("table");
  const rows = table
    .getByRole("row")
    .filter({ hasNot: page.getByRole("columnheader") }); // Exclude the header row

  await expect(rows).toHaveCount(applications.length);

  for (const [i, app] of applications.entries()) {
    const row = rows.nth(i);
    const formattedDate = new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Europe/London",
    }).format(new Date(app.modifiedAt));

    await expect(row.getByRole("link", { name: app.name })).toHaveAttribute(
      "href",
      `/cases/${app.applicationRefNumber}/task-list/`,
    );
    await expect(row.getByRole("cell").nth(1)).toHaveText(
      app.applicationRefNumber,
    );
    await expect(row.getByRole("cell").nth(2)).toHaveText(formattedDate);
  }
});
