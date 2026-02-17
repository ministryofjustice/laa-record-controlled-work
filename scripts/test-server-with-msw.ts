/**
 * Test Server with MSW Integration
 * 
 * This script starts the actual Express application with MSW enabled for E2E testing.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 */

import { setupServer } from 'msw/node';
import { handlers } from '../tests/playwright/factories/handlers/index.js';

// Initialize MSW before importing the app
const mswServer = setupServer(...handlers);

// Constants for configuration
const TEST_PORT = '3000';
const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

// Enable request interception with simple warning for unhandled requests
mswServer.listen({ 
  /**
   * Handler for unhandled requests to provide warning feedback
   * @param {Request} req - The unhandled request
   * @param {object} print - Logging utilities with warning method
   * @param {Function} print.warning - Warning logging function
   * @returns {void}
   */
  onUnhandledRequest: (req: Request, print: { warning: () => void }): void => {
    print.warning();
  }
});
console.log('🎭 MSW server started - intercepting outbound requests');

// Set environment variables for the Express app
process.env.NODE_ENV = 'test';
process.env.PORT = TEST_PORT;
process.env.SESSION_SECRET ??= 'test-secret-key';
process.env.SESSION_NAME ??= 'test-session';
process.env.SERVICE_NAME ??= 'Test Express Template';

// Now import and start the actual Express application
const appModulePath = '../public/app.js';

import(appModulePath)
  .then(() => {
    console.log('✅ Express application started successfully with MSW integration');
  })
  .catch((error: unknown) => {
    console.error('💥 Failed to start Express application:', error);
    console.log('📝 Make sure to run "yarn build" first');
    console.log('📝 Expected file location: public/app.js');
    process.exit(ERROR_EXIT_CODE);
  });

// Graceful shutdown
/**
 * Handles graceful shutdown of the server when receiving termination signals
 * @param {string} signal - The termination signal received (SIGTERM, SIGINT, etc.)
 * @returns {void}
 */
const gracefulShutdown = (signal: string): void => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  mswServer.close();
  process.exit(SUCCESS_EXIT_CODE);
};

process.on('SIGTERM', () => { gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { gracefulShutdown('SIGINT'); });

// Handle uncaught exceptions
process.on('uncaughtException', (error: unknown) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(ERROR_EXIT_CODE);
});

process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(ERROR_EXIT_CODE);
});