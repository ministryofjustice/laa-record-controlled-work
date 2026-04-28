/**
 * @file Locale middleware for Express applications
 * Provides internationalization (i18n) support by injecting locale data into templates
 */

import { t } from "#/lib/i18nLoader.js";
import type { ExpressLocaleLoader } from "#/types/express-types.js";
import type { NextFunction, Request, Response } from "express";

/**
 * Express middleware to inject locale data into template locals
 * This makes the locale data available in all Nunjucks templates
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 */
export function setupLocaleMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const localeData: ExpressLocaleLoader = {
    t,
  };

  const { t: localeT } = localeData;

  // Make locale data available in all templates
  res.locals.t = localeT;

  // Also make it available on the request object for controllers
  req.locale = localeData;

  next();
}
