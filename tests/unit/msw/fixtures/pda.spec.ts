import { expect } from "chai";

import { ProviderFirmOfficeDto } from "#/api/clients/pda/model/providerFirmOfficeDto.zod.gen.js";
import { getProviderOfficeResponse } from "#msw/fixtures/pda.js";

describe("PDA fixtures", () => {
  it("returns detailed data correlated to the requested office code", () => {
    const response = getProviderOfficeResponse("AB12CD");

    expect(response.office?.firmOfficeCode).to.equal("AB12CD");
    expect(response.office?.addressLine1).to.be.a("string").and.not.empty;
    expect(ProviderFirmOfficeDto.safeParse(response).success).to.equal(true);
  });

  it("returns the same office details on subsequent calls", () => {
    const firstResponse = getProviderOfficeResponse("AB12CD");
    const secondResponse = getProviderOfficeResponse("AB12CD");

    expect(secondResponse).to.eql(firstResponse);
  });
});