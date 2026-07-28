import { getPdaApiDefaultOptions } from "#/api/getPdaApiDefaultOptions.js";
import config from "#/config.js";
import { expect } from "chai";

describe("getPdaApiDefaultOptions", () => {
  it("should return RequestInit with config API key in Authorization header", () => {
    const result = getPdaApiDefaultOptions();

    expect(result.headers).to.deep.equal({
      Authorization: config.api.pda.key,
    });
  });
});
