import { expect } from "chai";

import { getProviderOfficesResponse } from "#msw/fixtures/pda.js";

describe("PDA fixtures", () => {
  it("returns offices with the configured codes", () => {
    const response = getProviderOfficesResponse(2, ["0R128U", "0R695K"]);

    expect(
      response.offices?.map(({ firmOfficeCode }) => firmOfficeCode),
    ).to.eql(["0R128U", "0R695K"]);
  });

  it("returns one office for every configured code", () => {
    const officeCodes = Array.from(
      { length: 11 },
      (_, index) => `OFFICE${index}`,
    );

    const response = getProviderOfficesResponse(2, officeCodes);

    expect(
      response.offices?.map(({ firmOfficeCode }) => firmOfficeCode),
    ).to.eql(officeCodes);
  });

  it("returns the same office details on subsequent calls", () => {
    const officeCodes = ["0R128U", "0R695K"];

    const firstResponse = getProviderOfficesResponse(2, officeCodes);
    const secondResponse = getProviderOfficesResponse(2, officeCodes);

    expect(secondResponse).to.eql(firstResponse);
  });
});