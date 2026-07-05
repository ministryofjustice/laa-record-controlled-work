/**
 * Dev Server with MSW Integration
 *
 * This script starts the app with MSW intercepting outbound API calls.
 * It initializes MSW to intercept outgoing API calls and serve mock responses.
 *
 */

import { setupServer } from "msw/node";

import { handlers } from "../tests/playwright/factories/handlers/index.js";

const mswServer = setupServer(...handlers);
const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

mswServer.listen({
  onUnhandledRequest: (req, print) => {
    // Only warn for calls to our own API base URL, not internal Express routes
    if (new URL(req.url).pathname.startsWith("/api/")) {
      print.warning();
    }
  },
});

console.log("🎭 MSW active — outbound API calls will be intercepted");

const gracefulShutdown = (signal: string): void => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  mswServer.close();
  process.exit(SUCCESS_EXIT_CODE);
};

process.on("SIGTERM", () => {
  gracefulShutdown("SIGTERM");
});
process.on("SIGINT", () => {
  gracefulShutdown("SIGINT");
});
process.on("uncaughtException", (error: unknown) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(ERROR_EXIT_CODE);
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(ERROR_EXIT_CODE);
});

await import("../src/server.js");
