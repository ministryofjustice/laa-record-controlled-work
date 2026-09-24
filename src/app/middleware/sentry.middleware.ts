import * as Sentry from "@sentry/node";

import { resolveSentryDsn } from "#/lib/resolveSentryDsn.js";

/** Initialise Sentry when it is enabled and configured. */
export function setupSentry(): void {
  if (process.env.SENTRY_ENABLED !== "true") {
    return;
  }

  const sentryDsn = resolveSentryDsn();

  if (!sentryDsn) {
    return;
  }

  Sentry.init({
    debug: process.env.SENTRY_DEBUG === "true",
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENV ?? "production",
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      Sentry.consoleLoggingIntegration({
        levels: ["log", "warn", "error"],
      }),
    ],
  });
}
