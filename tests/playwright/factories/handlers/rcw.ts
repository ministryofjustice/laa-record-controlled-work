/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { getCreateApplicationMockHandler, getGetApplicationsMockHandler, getGetApplicationMockHandler } from "../../../mocks/api/rcw/msw/applications/applications.msw.gen.js";
import { applications, createApplicationResponse, application } from "../../fixtures/rcw.fixtures.js";

export const rcwHandlers = [getGetApplicationsMockHandler(applications), getCreateApplicationMockHandler(createApplicationResponse), getGetApplicationMockHandler(application)];
