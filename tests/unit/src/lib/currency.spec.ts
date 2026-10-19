/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic display values */
import { expect } from "chai";
import { describe, it } from "mocha";

import { formatGBP } from "#/lib/currency.js";

describe("formatGBP", () => {
  it("formats pounds with two decimal places by default", () => {
    expect(formatGBP(1_234)).to.equal("£1,234.00");
    expect(formatGBP(1_234.5)).to.equal("£1,234.50");
  });

  it("omits pence only for whole amounts when requested", () => {
    expect(formatGBP(1_234, true)).to.equal("£1,234");
    expect(formatGBP(1_234.5, true)).to.equal("£1,234.50");
  });

  it("preserves zero and negative amount formatting", () => {
    expect(formatGBP(0)).to.equal("£0.00");
    expect(formatGBP(-0)).to.equal("£0.00");
    expect(formatGBP(-12.5)).to.equal("-£12.50");
  });
});
