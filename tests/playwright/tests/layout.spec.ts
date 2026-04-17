import { test, expect } from '../fixtures/index.js';

test.describe('Layout header', () => {
  test('layout should contain LAA header', async ({ page }) => {
    await page.goto('/');

    // Check for the header with LAA branding
    const header = page.locator('.moj-header');
    await expect(header).toBeVisible();

    // Check for MoJ branding which is typically in the header
    await expect(page.locator('.moj-header').getByRole('link', { name: 'Legal Aid Agency' })).toBeVisible();
  });

  test('layout should contain navigation', async ({ page }) => {
    await page.goto('/');

    // Check for the service navigation
    const navigation = page.locator('.govuk-service-navigation');
    await expect(navigation).toBeVisible();

    // Check for navigation links
    await expect(page.getByRole('link', { name: 'Your cases' })).toBeVisible();
  });

  test('layout should contain phase banner', async ({ page }) => {
    await page.goto('/');

    // Check for the phase banner
    const phaseBanner = page.locator('.govuk-phase-banner');
    await expect(phaseBanner).toBeVisible();

    // Check for feedback link
    await expect(page.getByRole('link', { name: 'give your feedback by email' })).toBeVisible();
  });
});

test.describe('Layout footer', () => {
  test('homepage has a footer', async ({ page }) => {
    await page.goto('/');

    const footer = page.locator('.govuk-footer');
    await expect(footer).toBeVisible();

  })
});