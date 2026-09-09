import type { NextFunction, Request, RequestHandler, Response } from "express";

import type { ExpressLocaleLoader } from "#/@types/express.js";

import { t } from "#/lib/i18n.js";

/**
 * Express middleware to inject locale data into template locals
 * This makes the locale data available in all Nunjucks templates
 *
 * @returns {RequestHandler}  Locale middleware function for Express.
 */
export function locale(): RequestHandler {
  return (req: Request, res: Response, next: NextFunction): void => {
    const localeData: ExpressLocaleLoader = {
      t,
    };

    const { t: localeT } = localeData;

    // Make locale data available in all templates.
    res.locals.t = localeT;

    // Also make it available on the request object for controllers.
    req.locale = localeData;

    next();
  };
}
