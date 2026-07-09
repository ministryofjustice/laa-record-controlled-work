import type { Application, Request } from "express";

import morgan from "morgan";

const skipAuthCallback = (req: Request): boolean => {
  const url = req.originalUrl || req.url;
  return url.includes("/auth/code/callback");
};

/**
 * Sets up request logging middleware for the given Express application.
 * Logs structured JSON for deployed environments (production, staging, uat).
 * Uses morgan's `dev` format for human-readable output in local environments.
 *
 * @param {Application} app - The Express application instance.
 */
const LOCAL_ENVIRONMENTS = new Set(["development", "docker", "test"]);

export const setupRequestLogging = (app: Application): void => {
  if (!LOCAL_ENVIRONMENTS.has(process.env.NODE_ENV ?? "")) {
    morgan.token("request_id", (req: Request) =>
      req.headers["x-request-id"]?.toString(),
    );
    app.use(
      morgan(
        (tokens, req, res) =>
          JSON.stringify({
            content_length: tokens.res(req, res, "content-length"),
            method: tokens.method(req, res),
            referrer: tokens.referrer(req, res),
            request_id: tokens.request_id(req, res),
            response_time: Number(tokens["response-time"](req, res)),
            status: Number(tokens.status(req, res)),
            time: tokens.date(req, res, "iso"),
            uri: tokens.url(req, res),
            user_agent: tokens["user-agent"](req, res),
          }),
        { skip: skipAuthCallback },
      ),
    );
  } else {
    app.use(morgan("dev", { skip: skipAuthCallback }));
  }
};
