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

test("unauthenticated user can sign in via Entra and reach the protected page", async ({
  unauthenticated: { page },
}) => {
  const authRedirect = page.waitForResponse(
    (resp) => resp.url().endsWith("/auth/redirect") && resp.status() === 302,
  );

  // Intercept the Entra authorize redirect and immediately POST back
  // to the app's redirect URI with a mock auth code — no sign-in form needed.
  await page.route(
    /login\.microsoftonline\.com.*\/oauth2.*\/authorize/,
    async (route) => {
      const { searchParams } = new URL(route.request().url());
      const redirectUri = searchParams.get("redirect_uri") ?? "";
      const state = searchParams.get("state") ?? "";

      await route.fulfill({
        contentType: "text/html",
        body: `<form method="POST" action="${redirectUri}">
          <input name="code" value="mock-auth-code-123">
          <input name="state" value="${state}">
        </form>
        <script>document.forms[0].submit()</script>`,
      });
    },
  );

  await page.goto("/landing");
  // Verify we are redirected to redirect endpoint "/auth/redirect" after mock sign in
  await authRedirect;

  await expect(page).toHaveURL("/landing");
});
