/**
 * Pda APi Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { getGetAllProviderOfficesMockHandler } from "../../../mocks/api/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";
import { getProviderOfficesResponse } from "../../fixtures/pda.fixtures.js";
import config from "#/config.js";

export const pdaApiHandlers = [
	getGetAllProviderOfficesMockHandler(
		getProviderOfficesResponse(config.api.pda.mswOfficeCount),
	),
];
