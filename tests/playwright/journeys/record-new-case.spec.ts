import { test, expect } from "../fixtures/index.js";

test("ecf step", async ({ page }) => {
  // Navigate to the ECF page
  await page.goto("/new-case/ecf");

  // Check for the title of the application
  await expect(page).toHaveTitle(/Does this case require Exceptional Case Funding\?/);
});