import { expect } from "chai";
import { describe, it } from "mocha";

import type { Address } from "#/api/clients/rcw/model/address.zod.gen.js";
import type { ClientDetails } from "#/api/clients/rcw/model/clientDetails.zod.gen.js";

import {
  formatClientAddress,
  formatDateOfBirth,
} from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.formatter.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

const UK_ADDRESS: Address = {
  addressLine1: "1 Test Lane",
  addressLine2: "Test Area",
  addressLine3: null,
  addressLine4: null,
  country: "GB",
  county: "Test County",
  createdAt: null,
  id: null,
  modifiedAt: null,
  postCode: "TE5 7AA",
  townOrCity: "Test Town",
};

function makeClientDetails(
  overrides: Partial<ClientDetails> = {},
): ClientDetails {
  return {
    ...getGetApplicationResponseMock().clientDetails,
    address: UK_ADDRESS,
    hasFixedAddress: true,
    ...overrides,
  };
}

describe("formatClientAddress", () => {
  it("returns null when the client has no fixed address", () => {
    expect(
      formatClientAddress(
        makeClientDetails({
          hasFixedAddress: false,
        }),
      ),
    ).to.equal(null);
  });

  it("returns no formatted lines when a fixed address is missing", () => {
    expect(formatClientAddress(makeClientDetails({ address: null }))).to.deep.equal(
      [],
    );
  });

  it("formats a UK address without the country", () => {
    expect(formatClientAddress(makeClientDetails())).to.deep.equal([
      "1 Test Lane",
      "Test Area",
      "Test Town",
      "Test County",
      "TE5 7AA",
    ]);
  });

  it("formats a non-GB address as international", () => {
    expect(
      formatClientAddress(
        makeClientDetails({ address: { ...UK_ADDRESS, country: "FR" } }),
      ),
    ).to.deep.equal(["1 Test Lane", "Test Area", "France"]);
  });

  for (const { expected, extraLines, name } of [
    {
      name: "third address line",
      extraLines: { addressLine3: "Region", addressLine4: null },
      expected: ["1 Test Lane", "Test Area", "Region", "France"],
    },
    {
      name: "fourth address line",
      extraLines: { addressLine3: null, addressLine4: "District" },
      expected: ["1 Test Lane", "Test Area", "District", "France"],
    },
    {
      name: "third and fourth address lines",
      extraLines: { addressLine3: "Region", addressLine4: "District" },
      expected: [
        "1 Test Lane",
        "Test Area",
        "Region",
        "District",
        "France",
      ],
    },
  ]) {
    it(`includes the ${name} for an international address`, () => {
      expect(
        formatClientAddress(
          makeClientDetails({
            address: {
              ...UK_ADDRESS,
              ...extraLines,
              country: "FR",
            },
          }),
        ),
      ).to.deep.equal(expected);
    });
  }

  it("trims lines and removes blank values", () => {
    expect(
      formatClientAddress(
        makeClientDetails({
          address: {
            ...UK_ADDRESS,
            addressLine1: "  1 Test Lane  ",
            addressLine2: "  ",
            county: null,
            postCode: " TE5 7AA ",
            townOrCity: " Test Town ",
          },
        }),
      ),
    ).to.deep.equal(["1 Test Lane", "Test Town", "TE5 7AA"]);
  });
});

describe("formatDateOfBirth", () => {
  it("formats an ISO date in UTC", () => {
    expect(formatDateOfBirth("1982-01-01")).to.equal("1 January 1982");
  });
});
