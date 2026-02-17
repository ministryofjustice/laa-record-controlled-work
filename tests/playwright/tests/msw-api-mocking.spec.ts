import { test, expect } from '../fixtures/index.js';

test('MSW intercepts outbound API calls', async ({ page }) => {
  // Navigate to the users endpoint which makes an outbound API call
  await page.goto('/users');
  
  // Wait for the JSON response to load
  await page.waitForLoadState('networkidle');
  
  // Check that we get our mock data instead of real API data
  const content = await page.textContent('body');
  const users = JSON.parse(content || '[]');
  
  // Verify we got our mock users
  expect(users).toHaveLength(3);
  expect(users[0]).toHaveProperty('name', 'Alice Johnson');
  expect(users[0]).toHaveProperty('email', 'testuser1@example.com');
  expect(users[1]).toHaveProperty('name', 'Bob Smith');
  expect(users[2]).toHaveProperty('name', 'Carol Davis');
  
  // Verify the structure matches our mock data factory
  for (const user of users) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('username');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('phone');
    expect(user).toHaveProperty('website');
  }
});

test('MSW mock data is consistent', async ({ page }) => {
  // Make the same request twice to ensure consistent mocking
  await page.goto('/users');
  await page.waitForLoadState('networkidle');
  const firstResponse = JSON.parse(await page.textContent('body') || '[]');
  
  await page.goto('/users');
  await page.waitForLoadState('networkidle');
  const secondResponse = JSON.parse(await page.textContent('body') || '[]');
  
  // Verify responses are identical (MSW is providing consistent mock data)
  expect(firstResponse).toEqual(secondResponse);
  expect(firstResponse[0].name).toBe('Alice Johnson');
});