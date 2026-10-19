import { expect } from "chai";
import sinon from "sinon";

import {
  InvalidOfficeError,
} from "#/journeys/journey.errors.js";
import { mapAvailableOffice } from "#/journeys/select-office/mappers/mapAvailableOffice.js";
import { logger } from "#/logger.js";

const officeResponse = (overrides: Record<string, unknown> = {}) => ({
  firm: { firmName: "Acme Legal LLP" },
  office: {
    addressLine1: "1 High Street",
    city: "Leeds",
    firmOfficeCode: "AB12CD",
    postCode: "LS1 1AA",
    ...overrides,
  },
});

describe("mapAvailableOffice", () => {
  afterEach(() => sinon.restore());

  it("maps a PDA office detail to journey office data", () => {
    expect(mapAvailableOffice(officeResponse())).to.deep.equal({
      address: "1 High Street, Leeds, LS1 1AA",
      code: "AB12CD",
      firmName: "Acme Legal LLP",
    });
  });

  it("preserves address and code when the firm name is missing", () => {
    expect(mapAvailableOffice({ ...officeResponse(), firm: {} })).to.deep.equal(
      {
        address: "1 High Street, Leeds, LS1 1AA",
        code: "AB12CD",
      },
    );
  });

  it("throws InvalidOfficeError when the office code is missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffice(officeResponse({ firmOfficeCode: null })),
    ).to.throw(InvalidOfficeError);
  });

  it("throws InvalidOfficeError when all address details are missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffice(
        officeResponse({
          addressLine1: null,
          city: null,
          postCode: null,
        }),
      ),
    ).to.throw(InvalidOfficeError);
  });
});