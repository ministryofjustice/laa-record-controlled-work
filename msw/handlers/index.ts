import { http, HttpResponse } from "msw";

import config from "#/config.js";

import { entraHandlers } from "./entra.js";
import { pdaApiHandlers } from "./pda.js";
import { rcwHandlers } from "./rcw.js";

// Logs all intercepted requests; returns undefined to pass through to actual handlers
const debugHandler = http.all("*", () => undefined);

export const handlers = [
  debugHandler,
  ...(config.api.rcw.mode === "msw" ? rcwHandlers : []),
  ...(config.api.pda.mode === "msw" ? pdaApiHandlers : []),
  ...entraHandlers,

  http.get("/health", () =>
    HttpResponse.json({
      msw: "active",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  ),
];
