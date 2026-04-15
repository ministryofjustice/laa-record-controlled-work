import { test, expect } from "../fixtures/index.js";
import { ENTRA_TEST_CONFIG } from "../playwright.config.js";

test("unauthenticated user visiting landing page is redirected to microsoft entra sign in page", async ({
  unauthenticated: { page },
}) => {
  const signinRedirect = page.waitForResponse(
    (resp) => resp.url().endsWith("/auth/signin") && resp.status() === 302,
  );

  await page.goto("/landing");
  // Verify we are redirected to sign in endpoint "/auth/signin"
  await signinRedirect;

  await expect(page).toHaveURL(
    new RegExp(
      `login\\.microsoftonline\\.com/${ENTRA_TEST_CONFIG.TENANT_ID}/oauth2`,
    ),
  );
});
