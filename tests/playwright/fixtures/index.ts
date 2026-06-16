import { test as base, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "../pages/PageFactory.js";
import { TEST_CONFIG } from "../playwright.config.js";

/**
 * Custom test fixture with accessibility testing.
 *
 * Authentication behaviour:
 * - All tests are signed in automatically via /test/signin.
 * - To test unauthenticated behaviour, use the `unauthenticated` fixture:
 *     test('redirects to sign in', async ({ unauthenticated: { page } }) => { ... })
 */
interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory;
  unauthenticated: { page: import("@playwright/test").Page };
}

export const test = base.extend<TestFixtures>({
  /**
   * Override the default page to sign in automatically before each test.
   */
  page: async ({ page }, use): Promise<void> => {
    await page.goto("/test/signin");

    // If the test route isn't registered, requireAuth redirects to Entra.
    // Catch this early so the failure message points at the real cause
    if (!page.url().startsWith(TEST_CONFIG.BASE_URL)) {
      throw new Error(
        `Auth bypass failed — redirected to: ${page.url()}\n` +
          "The test server must be running with PLAYWRIGHT_TEST_SIGNIN=true and NODE_ENV=test.\n" +
          "Stop any dev server before running e2e tests: kill -9 $(lsof -t -i :3001)",
      );
    }

    await use(page);
  },

  /**
   * Provides an unauthenticated page for tests that need to exercise the
   * auth redirect. Uses a fresh browser context so the signed-in session
   * from the default `page` fixture doesn't leak through.
   */
  unauthenticated: async ({ browser }, use): Promise<void> => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await use({ page });
    await context.close();
  },

  /**
   * Fixture that provides accessibility testing functionality using axe-core
   */
  checkAccessibility: async ({ page }, use): Promise<void> => {
    const checkAccessibility = async (): Promise<void> => {
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(["wcag22a"])
        .analyze();

      const { violations } = accessibilityScanResults;
      expect(violations).toEqual([]);
    };
    await use(checkAccessibility);
  },

  /**
   * Fixture that provides page object factory for creating page instances
   */
  pages: async ({ page }, use): Promise<void> => {
    const pageFactory = new PageFactory(page);
    await use(pageFactory);
  },
});

export { expect } from "@playwright/test";
