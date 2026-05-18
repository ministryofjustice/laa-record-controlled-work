import { test, expect } from "../fixtures/index.js";
import { ENTRA_TEST_CONFIG } from "../playwright.config.js";

const ENTRA_URL_PATTERN = new RegExp(
  `login\\.microsoftonline\\.com/${ENTRA_TEST_CONFIG.ENTRA_TENANT_ID}/oauth2`,
);



test("unauthenticated user visiting landing page is redirected to microsoft entra sign in page", async ({
  unauthenticated: { page },
}) => {
  const signinRedirect = page.waitForResponse(
    (resp) => resp.url().endsWith("/auth/signin") && resp.status() === 302,
  );

  await page.goto("/landing");
  await signinRedirect;

  await expect(page).toHaveURL(ENTRA_URL_PATTERN);
});

test.describe("GET /auth/signout", () => {
  test("signing out destroys the session and redirects to /", async ({ page }) => {
    const signoutRedirect = page.waitForResponse(
      (resp) => resp.url().endsWith("/auth/signout") && resp.status() === 302,
    );

    await page.goto("/landing");
    await page.getByRole("link", { name: "Sign out" }).click();
    await signoutRedirect;

    await expect(page).toHaveURL(ENTRA_URL_PATTERN);
  });
});
