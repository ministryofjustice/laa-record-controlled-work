import { test as base, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { PageFactory } from "../pages/PageFactory.js";

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
