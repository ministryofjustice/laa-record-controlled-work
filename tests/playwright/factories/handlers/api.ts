/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { getGetApplicationsMockHandler } from "../../../mocks/api/msw/applications/applications.msw.gen.js";
import { applications } from "../../fixtures/applications.fixtures.js";

export const apiHandlers = [getGetApplicationsMockHandler(applications)];
