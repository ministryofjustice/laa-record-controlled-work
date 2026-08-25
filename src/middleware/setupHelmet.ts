import type { Application, NextFunction, Request, Response } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";

/**
 * Sets up Helmet middleware for the Express application to configure Content Security Policy (CSP).
 *
 * @param {import('express').Application} app - The Express application instance.
 */
import helmet from "helmet";
import crypto from "node:crypto";

import config from "#/config.js";

const RANDOMBYTES = 16;

/**
 * Middleware to generate a unique CSP nonce for each request.
 *
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} next - Express next function.
 */
export default function nonceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  res.locals.cspNonce = crypto.randomBytes(RANDOMBYTES).toString("base64");
  next();
}

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
          baseUri: ["'self'"], // Restrict base URI
          connectSrc: ["'self'"],
          defaultSrc: ["'self'"],
          fontSrc: ["'self'", "data:"], // Allow data: URIs for fonts
          formAction: ["'self'", config.entra.authority], // Restrict form submissions but allows redirects to Entra after signout
          frameSrc: ["'none'"], // Restrict frames
          imgSrc: ["'self'", "data:"], // Allow data: URIs for images
          mediaSrc: ["'self'"], // Restrict media
          objectSrc: ["'none'"], // Restrict <object>, <embed>, and <applet> elements
          scriptSrc: [
            "'self'",
            // Dynamic nonce function for CSP - using the correct helmet function signature
            (req: IncomingMessage, res: ServerResponse) => {
              // Type guard to check if res has locals property (Express response)
              if (
                "locals" in res &&
                typeof res.locals === "object" &&
                res.locals !== null
              ) {
                const cspNonce =
                  "cspNonce" in res.locals ? res.locals.cspNonce : undefined;
                return typeof cspNonce === "string"
                  ? `'nonce-${cspNonce}'`
                  : "'unsafe-inline'";
              }
              return "'unsafe-inline'";
            },
          ],
          styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
          upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
        },
      },
    }),
  );
};
