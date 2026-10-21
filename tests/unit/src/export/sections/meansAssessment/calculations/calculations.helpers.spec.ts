/* eslint-disable @typescript-eslint/no-magic-numbers -- synthetic saved capital amounts */
import { expect } from "chai";
import { describe, it } from "mocha";

import { CFE_MAX_VALUE } from "#/export/sections/meansAssessment/calculations/calculations.constants.js";
import { floorCombinedAssessedCapital } from "#/export/sections/meansAssessment/calculations/calculations.helpers.js";

describe("floorCombinedAssessedCapital", () => {
  for (const { amount, expected, name } of [
    { amount: null, expected: null, name: "preserves null" },
    { amount: undefined, expected: null, name: "returns null for undefined" },
    { amount: -100, expected: 0, name: "floors negative amounts at zero" },
    {
      amount: -0.01,
      expected: 0,
      name: "floors negative fractional amounts at zero",
    },
    { amount: 0, expected: 0, name: "preserves zero" },
    {
      amount: 0.01,
      expected: 0.01,
      name: "preserves positive fractional amounts",
    },
    { amount: 1_000, expected: 1_000, name: "preserves positive amounts" },
    {
      amount: CFE_MAX_VALUE,
      expected: CFE_MAX_VALUE,
      name: "preserves the CFE maximum-value sentinel",
    },
  ]) {
    it(name, () => {
      expect(floorCombinedAssessedCapital(amount)).to.equal(expected);
    });
  }
});
