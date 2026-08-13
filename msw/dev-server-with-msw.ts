/**
 * Dev Server with MSW Integration
 *
 * This script starts the app with MSW intercepting outbound API calls.
 * Set USE_MSW=false in .env to connect to a real API instead.
 *
 */

import { setupServer } from "msw/node";

import config from "#/config.js";

import { handlers } from "./handlers/index.js";

const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

const useMsw = config.api.rcw.mode === "msw" || config.api.pda.mode === "msw";

if (useMsw) {
  const mswServer = setupServer(...handlers);

  mswServer.listen({
    onUnhandledRequest: (req, print) => {
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
} else {
  console.log("🔌 MSW disabled — connecting to real API");
}

process.on("uncaughtException", (error: unknown) => {
  console.error("💥 Uncaught Exception:", error);
  process.exit(ERROR_EXIT_CODE);
});
process.on("unhandledRejection", (reason: unknown) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(ERROR_EXIT_CODE);
});

await import("../src/server.js");
