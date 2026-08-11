import { http, HttpResponse } from "msw";

import { entraHandlers } from "./entra.js";
import { pdaApiHandlers } from "./pda.js";
import { rcwHandlers } from "./rcw.js";

const debugHandler = http.all("*", () => {});

export const handlers = [
  debugHandler,
  ...rcwHandlers,
  ...pdaApiHandlers,
  ...entraHandlers,

  http.get("/health", () =>
    HttpResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      msw: "active",
    }),
  ),
];