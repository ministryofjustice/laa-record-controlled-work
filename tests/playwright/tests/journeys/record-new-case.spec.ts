import { test, expect } from "../../fixtures/index.js";

test("ecf step", async ({ page }) => {
  // Navigate to the ECF page
  await page.goto("/new-case/ecf");

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Does this case require Exceptional Case Funding\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check for the radio options
  const yesOption = page.locator('input[type="radio"][value="yes"]');
  const noOption = page.locator('input[type="radio"][value="no"]');
  await expect(yesOption).toBeVisible();
  await expect(noOption).toBeVisible();

  // Check for the validation message when no option is selected
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Please select an option/,
  );

  // Select "Yes" and submit
  await yesOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the ECF dropout page
  await expect(page).toHaveURL("/new-case/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/new-case/ecf");

  // Select "No" and submit
  await noOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/new-case/legal-aid-before");
});
