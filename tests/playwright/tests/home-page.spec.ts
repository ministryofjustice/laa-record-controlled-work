import { test, expect } from '../fixtures/index.js';

test('homepage should have the correct title', async ({ page }) => {
	// Navigate to the homepage
	await page.goto('/');

	// Check for the title of the application
	await expect(page).toHaveTitle(/Test Express Template – GOV.UK/);
});

test('homepage should display LAA header', async ({ page }) => {
	await page.goto('/');

	// Check for the header with LAA branding
	const header = page.getByRole('banner');
	await expect(header).toBeVisible();

	// Check for GOV.UK branding which is typically in the header
	await expect(page.getByRole('link', { name: 'GOV.UK' })).toBeVisible();
});

test('home page displays service name and mountains table', async ({ pages, checkAccessibility }) => {
  const homePage = pages.homePage;
  
  // Navigate to home page
  await homePage.navigate();
  await homePage.waitForLoad();
  
  // Test the service name heading is present
  await expect(homePage.heading).toBeVisible();
  const serviceName = await homePage.getServiceName();
  expect(serviceName).toBeTruthy();
  
  // Test the mountains table is displayed
  await expect(homePage.mountainsTable).toBeVisible();
  await expect(homePage.tableCaption).toContainText('Mountains of the world');
  
  // Test specific mountains are in the table
  const mountains = await homePage.getMountainNames();
  expect(mountains).toContain('Everest');
  expect(mountains).toContain('Kilimanjaro');
  expect(mountains).toContain('Aconcagua');
  expect(mountains).toContain('Denali');
  
  // Test individual mountain row
  const everestRow = homePage.getMountainRow('Everest');
  await expect(everestRow).toBeVisible();
  await expect(everestRow).toContainText('8,850 meters');
  await expect(everestRow).toContainText('Asia');
  await expect(everestRow).toContainText('1953');
  
  // Run accessibility check
  await checkAccessibility();
});

test('home page table has correct structure', async ({ page, pages }) => {
  const homePage = pages.homePage;
  
  await homePage.navigate();
  await homePage.waitForLoad();
  
  // Check table headers
  const table = homePage.mountainsTable;
  await expect(table.locator('thead th').nth(0)).toHaveText('Name');
  await expect(table.locator('thead th').nth(1)).toHaveText('Elevation');
  await expect(table.locator('thead th').nth(2)).toHaveText('Continent');
  await expect(table.locator('thead th').nth(3)).toHaveText('First summit');
  
  // Check that all expected mountains are present
  const expectedMountains = [
    'Aconcagua', 'Denali', 'Elbrus', 'Everest', 
    'Kilimanjaro', 'Puncak Jaya', 'Vinson'
  ];
  
  const actualMountains = await homePage.getMountainNames();
  expect(actualMountains).toHaveLength(expectedMountains.length);
  
  for (const mountain of expectedMountains) {
    expect(actualMountains).toContain(mountain);
  }
});