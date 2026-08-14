import { http, HttpResponse } from "msw";

import { entraHandlers } from "#msw/handlers/entra.js";
import { pdaApiHandlers } from "#msw/handlers/pda.js";

import { rcwHandlers } from "./rcw.js";

const debugHandler = http.all("*", () => undefined);

export const handlers = [
  debugHandler,
  ...rcwHandlers,
  ...pdaApiHandlers,
  ...entraHandlers,

  http.get("/health", () =>
    HttpResponse.json({
      msw: "active",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  ),
];
