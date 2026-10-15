import { getGetFirmOfficeMockHandler } from "#orval/mocks/pda/msw/provider-firm-offices/provider-firm-offices.msw.gen.js";

import { getProviderOfficeResponse } from "../fixtures/pda.js";

export const pdaApiHandlers = [
  getGetFirmOfficeMockHandler(({ params }) => {
    const { officeCode } = params;
    return typeof officeCode === "string" &&
      officeCode !== process.env.PDA_MSW_FAIL_OFFICE_CODE
      ? getProviderOfficeResponse(officeCode)
      : undefined;
  }),
];
