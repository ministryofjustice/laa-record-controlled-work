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

test.describe("POST /auth/signout", () => {
  test("signing out redirects to Microsoft Entra logout", async ({ page }) => {
    const signoutRedirect = page.waitForResponse(
      (resp) => resp.url().endsWith("/auth/signout") && resp.status() === 302,
    );

    await page.goto("/landing");
    await page.getByRole("button", { name: "Sign out" }).click();
    await signoutRedirect;

    await expect(page).toHaveURL(ENTRA_URL_PATTERN);
  });

  test("after signing out, visiting a protected page redirects to sign in", async ({
    page,
  }) => {
    await page.goto("/landing");
    await page.getByRole("button", { name: "Sign out" }).click();

    await page.goto("/");
    await expect(page).toHaveURL(ENTRA_URL_PATTERN);
  });
});
