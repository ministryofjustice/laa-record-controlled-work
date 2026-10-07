import * as Sentry from "@sentry/node";

import { resolveSentryDsn } from "#/lib/resolveSentryDsn.js";

const DISABLED_TRACE_SAMPLE_RATE = 0;
const TRACE_EXCLUDED_PATHS = ["/health", "/status"] as const;
const ALLOWED_SENTRY_LOG_LEVELS = new Set(["error", "fatal", "info"]);
const SENSITIVE_LOG_ATTRIBUTES = new Set([
  "address",
  "dateOfBirth",
  "firstName",
  "lastName",
  "niNumber",
]);

type SentryLog = Sentry.Log;

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
    integrations.push(Sentry.consoleLoggingIntegration());
  }

  const options: Sentry.NodeOptions = {
    beforeSendLog: (log) => {
      if (!ALLOWED_SENTRY_LOG_LEVELS.has(log.level)) {
        return null;
      }

      if (log.attributes === undefined) {
        return log;
      }

      return {
        ...log,
        attributes: Object.fromEntries(
          Object.entries(log.attributes).filter(
            ([key]) => !SENSITIVE_LOG_ATTRIBUTES.has(key),
          ),
        ),
        message: redactSensitiveLogMessage(log),
      };
    },
    dataCollection: {
      cookies: false,
      databaseQueryData: false,
      genAI: { inputs: false, outputs: false },
      graphQL: { document: false, variables: false },
      httpBodies: [],
      httpHeaders: {
        request: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
        response: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
      },
      urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
      userInfo: false,
    },
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

      const isExcludedTrace = TRACE_EXCLUDED_PATHS.some(
        (path) => requestPath === path || name === `GET ${path}`,
      );

      if (isExcludedTrace) {
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

/**
 * Removes sensitive string attribute values from an interpolated log message.
 *
 * @param log - The Sentry log being filtered
 * @returns The message with sensitive values removed
 */
function redactSensitiveLogMessage(log: SentryLog): string {
  return Object.entries(log.attributes ?? {}).reduce(
    (message, [key, value]) => {
      if (
        !SENSITIVE_LOG_ATTRIBUTES.has(key) ||
        typeof value !== "string" ||
        value === ""
      ) {
        return message;
      }

      return message.replaceAll(value, "");
    },
    log.message,
  );
}
