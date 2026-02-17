/**
 * API Handlers for MSW
 * 
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { http, HttpResponse } from 'msw';

/**
 * Simple data factory for generating test users
 */
function createMockUser(id: number, overrides = {}) {
  return {
    id,
    name: `Test User ${id}`,
    username: `testuser${id}`,
    email: `testuser${id}@example.com`,
    phone: `555-000-${id.toString().padStart(4, '0')}`,
    website: `testuser${id}.example.com`,
    ...overrides
  };
}

/**
 * Mock data for the JSONPlaceholder API
 */
const mockUsers = [
  createMockUser(1, { name: 'Alice Johnson' }),
  createMockUser(2, { name: 'Bob Smith' }),
  createMockUser(3, { name: 'Carol Davis' })
];

/**
 * API handlers that intercept outbound requests from the Express app
 */
export const apiHandlers = [
  // Intercept the JSONPlaceholder users API call
  http.get('https://jsonplaceholder.typicode.com/users', () => {
    console.log('🎭 MSW intercepted request to JSONPlaceholder users API');
    return HttpResponse.json(mockUsers);
  }),

  // Example: Intercept a hypothetical government API
  http.get('https://api.gov.uk/example/data', () => {
    console.log('🎭 MSW intercepted request to government API');
    return HttpResponse.json({
      service: 'mock-government-api',
      data: 'This is mock data from a government API',
      timestamp: new Date().toISOString()
    });
  }),

  // Example: Intercept POST requests 
  http.post('https://api.example.com/submit', async ({ request }: { request: Request }) => {
    const body = await request.json();
    console.log('🎭 MSW intercepted POST request with body:', body);
    return HttpResponse.json({
      success: true,
      message: 'Mock submission received',
      id: Math.floor(Math.random() * 1000)
    });
  })
]; 
