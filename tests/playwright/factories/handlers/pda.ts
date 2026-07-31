/**
 * Pda APi Handlers for MSW
 *
 * These handlers intercept outgoing HTTP requests that the Express application makes
 * to external APIs and serve mock responses.
 */

import { getProviderOfficesResponse } from "../../fixtures/pda.fixtures.js";

export const pdaApiHandlers = [getProviderOfficesResponse(10)];
