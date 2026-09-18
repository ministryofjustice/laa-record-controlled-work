/* eslint-disable jsdoc/require-jsdoc -- logger API is intentionally compact and self-explanatory. */

import * as Sentry from "@sentry/node";
import pino, { type Logger } from "pino";

export interface LogContext {
  applicationId?: string;
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
}
export interface LogFields extends Record<string, unknown> {}

const SENSITIVE_FIELD_NAMES = new Set([
  "accessToken",
  "apiKey",
  "authorization",
  "cookie",
  "headers.authorization",
  "headers.cookie",
  "idToken",
  "password",
  "refreshToken",
  "req.headers.authorization",
  "req.headers.cookie",
  "secret",
  "token",
]);

export class AppLogger {
  constructor(
    private readonly logger: Logger,
    private readonly context: LogContext = {},
  ) {}

  // creates a context-bound child logger
  child(context: LogContext): AppLogger {
    return new AppLogger(this.logger.child(context), {
      ...this.context,
      ...context,
    });
  }

  debug(message: string, fields: LogFields = {}): void {
    this.logger.debug({ context: fields }, message);
    Sentry.logger.debug(message, {
      ...this.context,
      ...redactSensitiveFields(fields),
    });
  }
  error(message: string, error?: unknown, fields: LogFields = {}): void {
    this.logger.error({ context: fields, err: error }, message);
    Sentry.logger.error(message, {
      ...this.context,
      ...redactSensitiveFields(fields),
    });

    if (error instanceof Error) {
      Sentry.captureException(error);
    }
  }
  fatal(message: string, error: unknown, fields: LogFields = {}): void {
    this.logger.fatal({ context: fields, err: error }, message);
    Sentry.logger.fatal(message, {
      ...this.context,
      ...redactSensitiveFields(fields),
    });

    if (error instanceof Error) {
      Sentry.captureException(error);
    }
  }
  info(message: string, fields: LogFields = {}): void {
    this.logger.info({ context: fields }, message);
    Sentry.logger.info(message, {
      ...this.context,
      ...redactSensitiveFields(fields),
    });
  }
  warn(message: string, fields: LogFields = {}): void {
    this.logger.warn({ context: fields }, message);
    Sentry.logger.warn(message, {
      ...this.context,
      ...redactSensitiveFields(fields),
    });
  }
}

export function createLogger(context: LogContext = {}): AppLogger {
  return new AppLogger(
    pino({
      formatters: {
        level: (label): Record<string, string> => ({
          log_level: label.toUpperCase(),
        }),
      },
      level: process.env.LOG_LEVEL ?? "info",
      messageKey: "event",
      redact: {
        censor: "***",
        paths: [...SENSITIVE_FIELD_NAMES],
      },
      timestamp,
    }).child(context),
    context,
  );
}

// shallow redaction of known-sensitive keys before fields are sent to Sentry as log attributes
function redactSensitiveFields(fields: LogFields): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(fields).map(([key, value]) => [
      key,
      SENSITIVE_FIELD_NAMES.has(key) ? "***" : value,
    ]),
  );
}
export const logger = createLogger();

function timestamp(): string {
  const isoTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `,"timestamp":"${isoTimestamp}"`;
}
