import { test, expect } from "../../fixtures/index.js";

test("Your Cases step", async ({ page }) => {
  // Navigate to the Your Cases page
  await page.goto("/your-cases");

  // // Check the title of the page
  await expect(
    page.getByRole("heading", {
      name: /Your cases/,
      level: 1,
    }),
  ).toBeVisible();

  // Check the button
  await page.getByRole("button", { name: "Record a new case" }).click();

  // Verify redirection to the ECF page
  await expect(page).toHaveURL("/create-application/ecf");

  // Navigate back to the ECF page
  await page.goto("/your-cases");

  // Check the sub navigation
  const inProgressLink = page.getByRole("link", { name: "In progress" });
  const recordedLink = page.getByRole("link", { name: "Recorded" });

  // Check in progress link navigates to correct page and links have correct aria-current attribute
  await inProgressLink.click();
  await expect(page).toHaveURL("/your-cases");
  await expect(inProgressLink).toHaveAttribute("aria-current", "page");
  await expect(recordedLink).not.toHaveAttribute("aria-current", "page");

  // Check recorded link navigates to the correct page
  await recordedLink.click();
  await expect(page).toHaveURL("/your-cases-recorded");
});
