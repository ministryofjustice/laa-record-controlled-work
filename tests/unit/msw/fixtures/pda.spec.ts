import { expect } from "chai";

import { getProviderOfficesResponse } from "#msw/fixtures/pda.js";

describe("PDA fixtures", () => {
  it("returns offices with the configured codes", () => {
    const response = getProviderOfficesResponse(2, ["0R128U", "0R695K"]);

    expect(
      response.offices?.map(({ firmOfficeCode }) => firmOfficeCode),
    ).to.eql(["0R128U", "0R695K"]);
  });
});