import * as Sentry from "@sentry/node";

import { resolveSentryDsn } from "#/lib/resolveSentryDsn.js";

const DISABLED_TRACE_SAMPLE_RATE = 0;

/**
 * Creates the Sentry options from the current feature flag configuration.
 *
 * @param sentryDsn - The resolved Sentry DSN
 * @returns Sentry initialization options
 */
export function createSentryOptions(sentryDsn: string): Sentry.NodeOptions {
  const loggingEnabled = process.env.SENTRY_LOGGING_ENABLED !== "false";
  const tracingEnabled = process.env.SENTRY_TRACING_ENABLED !== "false";
  const integrations: NonNullable<Sentry.NodeOptions["integrations"]> = [
    Sentry.httpIntegration(),
    Sentry.expressIntegration(),
  ];

  if (loggingEnabled) {
    integrations.push(
      Sentry.consoleLoggingIntegration({
        levels: ["log", "warn", "error"],
      }),
    );
  }

  const options: Sentry.NodeOptions = {
    debug: process.env.SENTRY_DEBUG === "true",
    dsn: sentryDsn,
    environment: process.env.SENTRY_ENV ?? "production",
    integrations,
    tracesSampler: ({ inheritOrSampleWith, name, normalizedRequest }) => {
      if (!tracingEnabled) {
        return DISABLED_TRACE_SAMPLE_RATE;
      }

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
  };

  if (process.env.SENTRY_RELEASE) {
    options.release = process.env.SENTRY_RELEASE;
  }

  return options;
}

/** Initialise Sentry when it is enabled and configured. */
export function setupSentry(): void {
  if (process.env.SENTRY_ENABLED !== "true") {
    return;
  }

  const sentryDsn = resolveSentryDsn();

  if (!sentryDsn) {
    return;
  }

  Sentry.init(createSentryOptions(sentryDsn));
}
