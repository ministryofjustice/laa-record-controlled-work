import type { Express } from "express";

const TRUST_FIRST_PROXY = 1;

/**
 * Initializes security settings for the Express application.
 * @param app The Express application instance.
 */
export function initSecurity(app: Express): void {
  // Reducing fingerprinting by removing the 'x-powered-by' header
  app.disable("x-powered-by");

  // Set up cookie security for sessions
  app.set("trust proxy", TRUST_FIRST_PROXY);
}
