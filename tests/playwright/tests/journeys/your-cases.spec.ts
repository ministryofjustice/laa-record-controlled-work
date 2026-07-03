import { test, expect } from "../../fixtures/index.js";

test("Your Cases step", async ({ page }) => {
  await page.goto("/your-cases");

  // Check the title of the page
  const title = await page.locator("h1").textContent();
  expect(title).toBe("Your cases");

  // Check the button
  const recordButton = page.locator(".govuk-button");
  await expect(recordButton).toHaveText("Record a new case");
  await expect(recordButton).toHaveAttribute("href", "/create-application");

  // Check the table headers
  const tableHeaders = page.locator(".govuk-table thead th");
  await expect(tableHeaders.nth(0)).toHaveText("Client name");
  await expect(tableHeaders.nth(1)).toHaveText("Reference number");
  await expect(tableHeaders.nth(2)).toHaveText("Last updated");

  // Check the sub navigation
  const subNavigation = page.locator(".moj-sub-navigation");
  const subNavItems = subNavigation.locator("li");
  await expect(subNavItems.nth(0)).toHaveText("In progress");
  await expect(subNavItems.nth(0).locator("a")).toHaveAttribute(
    "href",
    "/your-cases",
  );

  subNavItems.nth(0).click();
  await expect(page).toHaveURL("/your-cases");

  await expect(subNavItems.nth(0).locator("a")).toHaveAttribute("aria-current", "page");
  await expect(subNavItems.nth(1)).toHaveText("Recorded");
  await expect(subNavItems.nth(1).locator("a")).toHaveAttribute(
    "href",
    "/your-cases-recorded",
  );
  await expect(subNavItems.nth(1).locator("a")).not.toHaveAttribute("aria-current", "page");

  subNavItems.nth(1).click();
  await expect(page).toHaveURL("/your-cases-recorded");
});
