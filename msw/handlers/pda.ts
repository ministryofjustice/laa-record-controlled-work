import config from "#/config.js";
import { getGetAllProviderOfficesMockHandler } from "#orval/mocks/pda/msw/provider-firms-endpoints/provider-firms-endpoints.msw.gen.js";

import { getProviderOfficesResponse } from "../fixtures/pda.js";

export const pdaApiHandlers = [
  getGetAllProviderOfficesMockHandler(
    getProviderOfficesResponse(config.api.pda.mswOfficeCount),
  ),
];
