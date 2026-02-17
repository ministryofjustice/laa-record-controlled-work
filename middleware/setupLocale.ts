/**
 * @file Locale middleware for Express applications
 * Provides internationalization (i18n) support by injecting locale data into templates
 */

import type { Request, Response, NextFunction } from 'express';
import { t, type ExpressLocaleLoader } from '#src/scripts/helpers/index.js';

/**
 * Express middleware to inject locale data into template locals
 * This makes the locale data available in all Nunjucks templates
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 */
export function setupLocaleMiddleware(req: Request, res: Response, next: NextFunction): void {

  const localeData: ExpressLocaleLoader = {
    t
  };

  const { t: localeT } = localeData;

  // Make locale data available in all templates
  res.locals.t = localeT;

  // Also make it available on the request object for controllers
  req.locale = localeData;

  next();
}

/**
 * Type augmentation for Express Request to include locale data
 */
declare global {
  namespace Express {
    interface Request {
      locale: ExpressLocaleLoader;
    }
  }
}