import { test, expect } from "../../fixtures/index.js";

test("create application flow", async ({ page }) => {
  // Test for ECF page
  
  // Navigate to the ECF page
  await page.goto("/create-application/ecf");

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
  await expect(page).toHaveURL("/create-application/ecf-dropout");

  // Navigate back to the ECF page
  await page.goto("/create-application/ecf");

  // Select "No" and submit
  await noOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the legal aid before page
  await expect(page).toHaveURL("/create-application/legal-aid-before");

  // Test for legal aid before page

  // Check for the question
  await expect(
    page.getByRole("heading", {
      name: /Has your client accessed legal aid before\?/,
      level: 1,
    }),
  ).toBeVisible();

  // Check for the radio options
  const yesSameMatterOption = page.locator(
    'input[type="radio"][value="yesSameMatter"]',
  );
  const yesDifferentMatterOption = page.locator(
    'input[type="radio"][value="yesDifferentMatter"]',
  );
  const noMatterOption = page.locator('input[type="radio"][value="no"]');
  await expect(yesSameMatterOption).toBeVisible();
  await expect(yesDifferentMatterOption).toBeVisible();
  await expect(noMatterOption).toBeVisible();
  
  // Check for the validation message when no option is selected
  await page.click('button[type="submit"]');
  await expect(page.locator(".govuk-error-message")).toHaveText(
    /Please select an option/,
  );

  // Select "Yes, about the same matter" and submit
  await yesSameMatterOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the legal aid before 2 page
  await expect(page).toHaveURL("/create-application/legal-aid-before-2");

  // Navigate back to the legal aid before page
  await page.goto("/create-application/legal-aid-before");

  // Select "Yes, about a different matter" and submit
  await yesDifferentMatterOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");

  // Navigate back to the legal aid before page
  await page.goto("/create-application/legal-aid-before");

  // Select "No" and submit
  await noMatterOption.check();
  await page.click('button[type="submit"]');
  // Verify redirection to the client details page
  await expect(page).toHaveURL("/create-application/client-details");
});
