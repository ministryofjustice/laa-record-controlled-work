import { getPdaApiDefaultOptions } from "#/api/getPdaApiDefaultOptions.js";
import config from "#/config.js";
import { expect } from "chai";

describe("getPdaApiDefaultOptions", () => {
  it("should return RequestInit with X-Authorization headers", () => {
    const result = getPdaApiDefaultOptions();

    expect(result.headers).to.deep.equal({
      "X-Authorization": config.api.pda.key,
    });
  });

  it("should include X-Correlation-Id header when present in request", () => {
    const correlationId = "test-correlation-id-123";
    const result = getPdaApiDefaultOptions(correlationId);

    expect(result.headers).to.deep.equal({
      "X-Authorization": config.api.pda.key,
      "X-Correlation-Id": correlationId,
    });
  });
});
