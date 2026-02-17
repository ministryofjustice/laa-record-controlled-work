/**
 * MSW Setup Configuration
 * 
 * Centralized configuration for MSW server setup and management.
 * Provides utilities for test setup, teardown, and handler management.
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers/index.js';

/**
 * MSW server instance for Node.js environment
 * Used in test setup and test server
 */
export const server = setupServer(...handlers);

/**
 * MSW server configuration options
 */
export const serverConfig = {
  onUnhandledRequest: 'warn' as const,
};

/**
 * Start MSW server with default configuration
 * Used in test setup and test server
 */
export function startMSWServer(): void {
  server.listen(serverConfig);
}

/**
 * Stop MSW server
 * Used in test teardown and graceful shutdown
 */
export function stopMSWServer(): void {
  server.close();
}

/**
 * Reset handlers to default state
 * Should be called between tests to ensure test isolation
 */
export function resetMSWHandlers(): void {
  server.resetHandlers();
}

/**
 * Add runtime handlers for specific test scenarios
 * @param {Array} additionalHandlers - Array of MSW handlers to add
 */
export function addRuntimeHandlers(additionalHandlers: any[]): void {
  server.use(...additionalHandlers);
}

/**
 * Environment validation for MSW setup
 * Ensures required environment variables are set
 */
export function validateTestEnvironment(): void {
  const requiredEnvVars = ['NODE_ENV'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
}
