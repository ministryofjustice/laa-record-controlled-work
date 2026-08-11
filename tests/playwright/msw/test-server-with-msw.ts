import { setupServer } from "msw/node";

import { handlers } from "./handlers/index.js";

const mswServer = setupServer(...handlers);

const TEST_PORT = "3001";
const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

mswServer.listen({
  onUnhandledRequest: (req: Request, print: { warning: () => void }): void => {
    print.warning();
  },
});

console.log("MSW test server started - intercepting outbound requests");

process.env.NODE_ENV = "test";
process.env.PORT = TEST_PORT;
process.env.SESSION_SECRET ??= "test-secret-key";
process.env.SERVICE_NAME ??= "Test Express Template";

const appModulePath = "../../../public/app.js";

import(appModulePath)
  .then(() => {
    console.log(
      "Express application started successfully with MSW integration",
    );
  })
  .catch((error: unknown) => {
    console.error("Failed to start Express application:", error);
    console.log('Make sure to run "yarn build" first');
    console.log("Expected file location: public/app.js");
    process.exit(ERROR_EXIT_CODE);
  });

const gracefulShutdown = (signal: string): void => {
  console.log(`\nReceived ${signal}, shutting down gracefully...`);
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
  console.error("Uncaught Exception:", error);
  process.exit(ERROR_EXIT_CODE);
});

process.on(
  "unhandledRejection",
  (reason: unknown, promise: Promise<unknown>) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason);
    process.exit(ERROR_EXIT_CODE);
  },
);
