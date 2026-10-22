import type { RequestHandler } from "express";
import type { IncomingMessage, ServerResponse } from "node:http";

import helmet from "helmet";

import { createBrowserSentryOptions } from "#/app/middleware/sentry.middleware.js";
import config from "#/config.js";

/**
 * Middleware to set up Helmet with a Content Security Policy (CSP) for the Express application.
 *
 * This *must* be registered after the `cspNonce` middleware to ensure that the nonce is available for use in the CSP directives.
 *
 * @returns {RequestHandler}  The configured Helmet middleware.
 */
function helmetMiddleware(): RequestHandler {
  const browserSentry = createBrowserSentryOptions();
  const connectSrc = ["'self'"];

  if (browserSentry) {
    connectSrc.push(new URL(browserSentry.dsn).origin);
  }

  return helmet({
    contentSecurityPolicy: {
      directives: {
        baseUri: ["'self'"], // Restrict base URI
        connectSrc,
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
                : "'none'";
            }
            return "'none'";
          },
        ],
        styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles if needed
        workerSrc: browserSentry ? ["'self'", "blob:"] : ["'self'"],
        ...(process.env.SENTRY_CSP_REPORT_ENDPOINT
          ? { reportUri: [process.env.SENTRY_CSP_REPORT_ENDPOINT] }
          : {}),
        upgradeInsecureRequests: [], // Upgrade HTTP to HTTPS
      },
    },
  });
}

export { helmetMiddleware as helmet };
