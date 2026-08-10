import { expect } from "chai";

import {
  mapCountryNameToIsoCode,
  mapIsoCodeToCountryName,
} from "#/lib/countries.js";

describe("countries utility", () => {
  it("maps country name to ISO code", () => {
    expect(mapCountryNameToIsoCode("United Kingdom")).to.equal("GB");
  });

  it("maps ISO code to country name", () => {
    expect(mapIsoCodeToCountryName("GB")).to.equal("United Kingdom");
  });

  it("returns input when country name is unknown", () => {
    expect(mapCountryNameToIsoCode("Not A Country")).to.equal("Not A Country");
  });

  it("returns input when ISO code is unknown", () => {
    expect(mapIsoCodeToCountryName("ZZ")).to.equal("ZZ");
  });
});
