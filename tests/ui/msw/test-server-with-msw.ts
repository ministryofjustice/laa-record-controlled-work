import { setupServer } from "msw/node";

import { handlers } from "./handlers/index.js";

const mswServer = setupServer(...handlers);

const TEST_PORT = "3001";
const SUCCESS_EXIT_CODE = 0;
const ERROR_EXIT_CODE = 1;

const ignoredUnhandledPaths = new Set(["/favicon.ico", "/robots.txt"]);

const shouldIgnoreUnhandledRequest = (req: Request): boolean => {
  const { pathname, protocol } = new URL(req.url);

  if (ignoredUnhandledPaths.has(pathname)) {
    return true;
  }

  return protocol === "data:" || protocol === "blob:";
};

mswServer.listen({
  onUnhandledRequest: (
    req: Request,
    print: { error: () => void; warning: () => void },
  ): void => {
    if (shouldIgnoreUnhandledRequest(req)) {
      return;
    }

    const { pathname } = new URL(req.url);
    if (pathname.startsWith("/api/") || pathname.includes("/oauth2/")) {
      print.error();
      return;
    }

    print.warning();
  },
});

console.log("MSW test server started - intercepting outbound requests");

process.env.NODE_ENV = "test";
process.env.PORT = TEST_PORT;
process.env.SESSION_SECRET ??= "test-secret-key";
process.env.SERVICE_NAME ??= "Test Express Template";
process.env.RATE_LIMIT_MAX = "10000";

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
