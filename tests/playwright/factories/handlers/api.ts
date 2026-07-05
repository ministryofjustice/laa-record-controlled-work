/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { getApplicationsMock } from "../../../mocks/api/msw/applications/applications.msw.gen.js";

export const apiHandlers = [
  ...getApplicationsMock(),
];
