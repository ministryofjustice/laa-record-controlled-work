import rateLimit from "express-rate-limit";
import type { Application, RequestHandler } from "express";
import type { Config } from "#/types/config-types.js";

/**
 * Coerces a number or numeric string to a number.
 *
 * @param {number | string} value - The value to coerce.
 * @returns {number} The numeric value.
 */
const toNumber = (value: number | string): number =>
  typeof value === "string" ? parseInt(value, 10) : value;

/**
 * Sets up rate limiting for the given Express app.
 *
 * @param {Application} app - The Express app instance.
 * @param {Config} config - The configuration object containing rate limiting settings.
 */
export const rateLimitSetUp = (app: Application, config: Config): void => {
  app.use(
    rateLimit({
      windowMs: toNumber(config.RATE_WINDOW_MS),
      max: toNumber(config.RATE_LIMIT_MAX),
      message: "Too many requests, please try again later.",
    }),
  );
};

/**
 * Creates a stricter rate limiter for authentication routes.
 *
 * @param {Config} config - The configuration object containing rate limiting settings.
 * @returns {RequestHandler} An Express rate limiting middleware instance.
 */
export const createAuthLimiter = (config: Config): RequestHandler =>
  rateLimit({
    windowMs: toNumber(config.RATE_WINDOW_MS),
    max: toNumber(config.AUTH_RATE_LIMIT_MAX),
    message: "Too many attempts, please try again later.",
  });
