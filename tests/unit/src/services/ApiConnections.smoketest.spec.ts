/**
 * API Connections Smoke Test
 * 
 * Simple test to verify that our API connection patterns work with MSW.
 * Tests the core functionality: making HTTP requests through BaseApiService
 * and getting mocked responses back.
 */

import { expect } from 'chai';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { create } from 'middleware-axios';
import { ExampleApiService } from '#src/services/exampleApiService.js';

describe('API Connections Smoke Test', function() {
  let server: ReturnType<typeof setupServer>;
  let axiosWrapper: any;
  let exampleApiService: ExampleApiService;

  before(function() {
    // Set up MSW server with simple handlers
    server = setupServer(
      // Mock the JSONPlaceholder API that ExampleApiService uses
      http.get('https://jsonplaceholder.typicode.com/users', () => {
        return HttpResponse.json([
          { id: 1, name: 'Test User 1', email: 'test1@example.com' },
          { id: 2, name: 'Test User 2', email: 'test2@example.com' }
        ]);
      }),

      http.get('https://jsonplaceholder.typicode.com/users/1', () => {
        return HttpResponse.json({ 
          id: 1, 
          name: 'Test User 1', 
          email: 'test1@example.com' 
        });
      })
    );

    // Start MSW server
    server.listen();

    // Create axios wrapper (simulating req.axiosMiddleware)
    axiosWrapper = create({
      baseURL: 'https://jsonplaceholder.typicode.com',
      timeout: 5000
    });

    // Create service instance
    exampleApiService = new ExampleApiService();
  });

  after(function() {
    server.close();
  });

  it('should successfully make API calls through BaseApiService patterns', async function() {
    // Test: BaseApiService can make HTTP requests and get responses
    const response = await exampleApiService.getUsers(axiosWrapper);

    expect(response).to.exist;
    expect(response.data).to.be.an('array');
    expect(response.data).to.have.length(2);
    expect(response.data[0]).to.have.property('name', 'Test User 1');
  });

  it('should handle single resource requests', async function() {
    // Test: BaseApiService can make parameterized requests
    const response = await exampleApiService.getUserById(axiosWrapper, '1');

    expect(response).to.exist;
    expect(response.data).to.be.an('object');
    expect(response.data).to.have.property('id', 1);
    expect(response.data).to.have.property('name', 'Test User 1');
  });
});