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

  await page.goto("/");
  await signinRedirect;

  await expect(page).toHaveURL(ENTRA_URL_PATTERN);
});

test.describe("POST /auth/signout", () => {
  test("signing out uses the accessible form and redirects locally", async ({
    page,
  }) => {
    const signoutRedirect = page.waitForResponse(
      (resp) =>
        resp.url().endsWith("/auth/signout") &&
        resp.request().method() === "POST" &&
        resp.status() === 302,
    );

    await page.goto("/");
    await page.getByRole("button", { name: "Sign out" }).click();
    const response = await signoutRedirect;

    expect(response.headers().location).toBe("/");
    await expect(page).toHaveURL(ENTRA_URL_PATTERN);
  });
});
