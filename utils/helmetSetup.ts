/**
 * Sets up Helmet middleware for the Express application to configure Content Security Policy (CSP).
 *
 * @param {import('express').Application} app - The Express application instance.
 */
import helmet from 'helmet';
import crypto from 'node:crypto';
import type { Request, Response, NextFunction, Application } from 'express';
import type { IncomingMessage, ServerResponse } from 'node:http';

const RANDOMBYTES = 16;

/**
 * Middleware to generate a unique CSP nonce for each request.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export const nonceMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  res.locals.cspNonce = crypto.randomBytes(RANDOMBYTES).toString('base64'); // Generate a secure random nonce
  next();
};

/**
 * Sets up Helmet's Content Security Policy (CSP) with a dynamic nonce.
 *
 * @param {Application} app - The Express application instance.
 */
export const helmetSetup = (app: Application): void => {
  app.use(nonceMiddleware); // Apply nonce middleware before Helmet

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            // Dynamic nonce function for CSP - using the correct helmet function signature
            (req: IncomingMessage, res: ServerResponse) => {
              // Type guard to check if res has locals property (Express response)
              if ('locals' in res && typeof res.locals === 'object' && res.locals !== null) {
                const cspNonce = 'cspNonce' in res.locals ? res.locals.cspNonce : undefined;
                return typeof cspNonce === 'string' ? `'nonce-${cspNonce}'` : "'unsafe-inline'";
              }
              return "'unsafe-inline'";
            }
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
          fontSrc: ["'self'", "data:"], // Allow data: URIs for fonts
          imgSrc: ["'self'", "data:"], // Allow data: URIs for images
          connectSrc: ["'self'"],
          objectSrc: ["'none'"], // Restrict <object>, <embed>, and <applet> elements
          mediaSrc: ["'self'"], // Restrict media
          frameSrc: ["'none'"], // Restrict frames
          formAction: ["'self'"], // Restrict form submissions
          baseUri: ["'self'"], // Restrict base URI
          upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
        }
      }
    })
  );
};
