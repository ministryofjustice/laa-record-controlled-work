import rateLimit from 'express-rate-limit';
import type { Application } from 'express';
import type { Config } from '#types/config-types.js';

/**
 * Sets up rate limiting for the given Express app.
 *
 * @param {Application} app - The Express app instance.
 * @param {Config} config - The configuration object containing rate limiting settings.
 */
export const rateLimitSetUp = (app: Application, config: Config): void => {
  /**
   * Rate limiter for general routes.
   * Limits each IP to a configurable number of requests per time window.
   */
  const generalLimiter = rateLimit({
    windowMs: typeof config.RATE_WINDOW_MS === 'string' ? parseInt(config.RATE_WINDOW_MS, 10) : config.RATE_WINDOW_MS,
    max: typeof config.RATE_LIMIT_MAX === 'string' ? parseInt(config.RATE_LIMIT_MAX, 10) : config.RATE_LIMIT_MAX,
    message: 'Too many requests, please try again later.'
  });

  // Apply the general rate limiter to all requests
  app.use(generalLimiter);
};
