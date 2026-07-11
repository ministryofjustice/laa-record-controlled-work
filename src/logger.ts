/* eslint-disable jsdoc/require-jsdoc -- logger API is intentionally compact and self-explanatory. */

import pino, { type Logger } from "pino";

export interface LogContext {
  applicationId?: string;
  correlationId?: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
}
export interface LogFields extends Record<string, unknown> {}

export class AppLogger {
  constructor(private readonly logger: Logger) {}

  // creates a context-bound child logger
  child(context: LogContext): AppLogger {
    return new AppLogger(this.logger.child(context));
  }

  debug(message: string, fields: LogFields = {}): void {
    this.logger.debug({ context: fields }, message);
  }
  error(message: string, error: unknown, fields: LogFields = {}): void {
    this.logger.error({ context: fields, err: error }, message);
  }
  fatal(message: string, error: unknown, fields: LogFields = {}): void {
    this.logger.fatal({ context: fields, err: error }, message);
  }
  info(message: string, fields: LogFields = {}): void {
    this.logger.info({ context: fields }, message);
  }
  warn(message: string, fields: LogFields = {}): void {
    this.logger.warn({ context: fields }, message);
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
        paths: [
          "req.headers.authorization",
          "req.headers.cookie",
          "headers.authorization",
          "headers.cookie",
          "password",
          "token",
          "accessToken",
          "refreshToken",
          "idToken",
          "apiKey",
          "secret",
        ],
      },
      timestamp,
    }).child(context),
  );
}
export const logger = createLogger();

function timestamp(): string {
  const isoTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  return `,"timestamp":"${isoTimestamp}"`;
}
