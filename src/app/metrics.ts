import type { Application } from "express";

import {
  collectDefaultMetrics,
  Counter,
  Histogram,
  Registry,
} from "prom-client";

const NANOSECONDS_PER_SECOND = 1e9;

/**
 * Registers process and HTTP metrics independently of sessions and authentication.
 * @param app The Express application.
 */
export function initMetrics(app: Application): void {
  const registry = new Registry();
  collectDefaultMetrics({ prefix: "rcw_", register: registry });

  const requests = new Counter({
    help: "Completed application HTTP requests",
    labelNames: ["method", "route", "status_code"],
    name: "rcw_http_requests_total",
    registers: [registry],
  });
  const duration = new Histogram({
    help: "Application HTTP response duration in seconds",
    labelNames: ["method", "route", "status_code"],
    name: "rcw_http_request_duration_seconds",
    registers: [registry],
  });

  app.get("/metrics", async (_req, res) => {
    res.set("Content-Type", registry.contentType);
    res.set("Cache-Control", "no-store");
    res.send(await registry.metrics());
  });

  app.use((req, res, next) => {
    if (["/health", "/metrics", "/status"].includes(req.path)) {
      next();
      return;
    }

    const started = process.hrtime.bigint();
    res.once("finish", () => {
      const route: unknown = req.route;
      const routePath = hasRoutePath(route) ? route.path : "unmatched";
      const labels = {
        method: [
          "DELETE",
          "GET",
          "HEAD",
          "OPTIONS",
          "PATCH",
          "POST",
          "PUT",
        ].includes(req.method)
          ? req.method
          : "OTHER",
        route: routePath,
        status_code: String(res.statusCode),
      };
      requests.inc(labels);
      duration.observe(
        labels,
        Number(process.hrtime.bigint() - started) / NANOSECONDS_PER_SECOND,
      );
    });
    next();
  });
}

/**
 * Checks whether an Express route has a string path.
 * @param route The route to check.
 * @returns Whether the route has a string path.
 */
function hasRoutePath(route: unknown): route is { path: string } {
  return (
    typeof route === "object" &&
    route !== null &&
    "path" in route &&
    typeof route.path === "string"
  );
}
