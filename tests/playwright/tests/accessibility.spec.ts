import { test, expect } from '../fixtures/index.js';

test('@accessibility homepage passes accessibility checks', async ({ page, signIn, checkAccessibility }) => {
	await signIn();
	await page.goto('/');
	await expect(page.locator('.govuk-header')).toBeVisible();
	await checkAccessibility();
});
