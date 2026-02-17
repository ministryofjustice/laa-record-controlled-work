import { test as base, expect } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';
import { PageFactory } from '../pages/PageFactory.js';

/**
 * Custom test fixture with accessibility testing
 */
interface TestFixtures {
  checkAccessibility: () => Promise<void>;
  pages: PageFactory; 
}

export const test = base.extend<TestFixtures>({
    /**
     * Fixture that provides accessibility testing functionality using axe-core
     * @param {object} param0 - Playwright test fixtures object
     * @param {import('@playwright/test').Page} param0.page - Playwright page object for the current test
     * @param {Function} use - Playwright fixture use function to provide the checkAccessibility function
     * @returns {Promise<void>} Promise that resolves when the fixture is ready
     */
    checkAccessibility: async ({ page }, use): Promise<void> => {
        /**
         * Function that performs accessibility scanning on the current page
         * @returns {Promise<void>} Promise that resolves when accessibility scan is complete
         */
        const checkAccessibility = async (): Promise<void> => {
        const accessibilityScanResults = await new AxeBuilder({ page })
            .withTags(['wcag22a'])
            .analyze();

        const { violations } = accessibilityScanResults;
        expect(violations).toEqual([]);
        };
        await use(checkAccessibility);
    },

    /**
     * Fixture that provides page object factory for creating page instances
     * @param {object} param0 - Playwright test fixtures object  
     * @param {import('@playwright/test').Page} param0.page - Playwright page object for the current test
     * @param {Function} use - Playwright fixture use function to provide the PageFactory instance
     * @returns {Promise<void>} Promise that resolves when the fixture is ready
     */
    pages: async ({ page }, use): Promise<void> => {
    const pageFactory = new PageFactory(page);
    await use(pageFactory);
    },
});

export { expect } from '@playwright/test';