import * as Sentry from "@sentry/node";

import { resolveSentryDsn } from "#/lib/resolveSentryDsn.js";

const DISABLED_TRACE_SAMPLE_RATE = 0;

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
    tracesSampler: ({ inheritOrSampleWith, name, normalizedRequest }) => {
      const requestPath = normalizedRequest?.url
        ? new URL(normalizedRequest.url, "http://localhost").pathname
        : undefined;

      if (requestPath === "/health" || name === "GET /health") {
        return DISABLED_TRACE_SAMPLE_RATE;
      }

      return inheritOrSampleWith(
        Number.parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE ?? "0.01"),
      );
    },
  });
}
