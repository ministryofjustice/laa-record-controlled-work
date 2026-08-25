import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";

import helmet from "helmet";

import config from "#/config.js";

/**
 * Middleware to set up Helmet with a Content Security Policy (CSP) for the Express application.
 *
 * This *must* be registered after the `cspNonce` middleware to ensure that the nonce is available for use in the CSP directives.
 *
 * @param {Request} req  The Express request object.
 * @param {Response} res  The Express response object.
 * @param {NextFunction} next  The next middleware function in the stack.
 * @returns {RequestHandler}  The configured Helmet middleware.
 */
function helmetMiddleware(): RequestHandler {
  return helmet({
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
  });
}

export { helmetMiddleware as helmet };
