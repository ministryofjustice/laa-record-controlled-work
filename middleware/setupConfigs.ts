import type { Application, Request, Response, NextFunction } from 'express';
import config from '#config.js';

/**
 * Middleware setup function to attach configuration settings to response locals.
 * This makes config values accessible in all templates rendered by the app.
 *
 * @param {Application} app - The Express application instance.
 */
export const setupConfig = (app: Application): void => {
  /**
   * Middleware to add config to response locals.
   *
   * @param {Request} req - The Express request object.
   * @param {Response} res - The Express response object.
   * @param {NextFunction} next - The next middleware function in the stack.
   */
  const configMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    res.locals.config = config;
    next();
  };
  app.use(configMiddleware);
};
