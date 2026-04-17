import { test, expect } from '../fixtures/index.js';

test('@accessibility homepage passes accessibility checks', async ({ page, checkAccessibility }) => {
	await page.goto('/');
	await expect(page.locator('.moj-header')).toBeVisible();
	await checkAccessibility();
});
