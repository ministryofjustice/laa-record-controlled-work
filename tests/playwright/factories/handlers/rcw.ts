/**
 * API Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import {
	getCreateApplicationMockHandler,
	getGetApplicationMockHandler,
	getGetApplicationsMockHandler,
} from "#/api/mocks/rcw/msw/applications/applications.msw.gen.js";
import {
	application,
	applications,
	createApplicationResponse,
} from "../../fixtures/rcw.fixtures.js";

export const rcwHandlers = [
	getGetApplicationsMockHandler(applications),
	getCreateApplicationMockHandler(createApplicationResponse),
	getGetApplicationMockHandler(application),
];
