import { getGetAllProviderOfficesMockHandler } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";
import { getProviderOfficesResponse } from "../../tests/playwright/fixtures/pda.fixtures.js";
import config from "#/config.js";

export const pdaApiHandlers = [
	getGetAllProviderOfficesMockHandler(
		getProviderOfficesResponse(config.api.pda.mswOfficeCount),
	),
];
