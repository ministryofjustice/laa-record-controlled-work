import { expect } from "chai";
import sinon from "sinon";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import {
  InvalidOfficeError,
  MissingFirmNameError,
  NoAvailableOfficesError,
} from "#/journeys/journey.errors.js";
import { mapAvailableOffices } from "#/journeys/select-office/mappers/mapAvailableOffices.js";
import { logger } from "#/logger.js";

describe("mapAvailableOffices", () => {
  afterEach(() => sinon.restore());

  it("maps PDA office data into journey office data", () => {
    const result = mapAvailableOffices({
      firm: {
        firmName: "Acme Legal LLP",
      },
      offices: [
        {
          addressLine1: "1 High Street",
          city: "Leeds",
          postCode: "LS1 1AA",
          firmOfficeCode: "LEEDS-01",
        },
      ],
    } satisfies ProviderFirmOfficeListDto);

    expect(result).to.deep.equal([
      {
        address: "1 High Street, Leeds, LS1 1AA",
        code: "LEEDS-01",
        firmName: "Acme Legal LLP",
      },
    ]);
  });

  it("throws MissingFirmNameError when firm name is missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffices({
        firm: {},
        offices: [
          {
            addressLine1: "1 High Street",
            firmOfficeCode: "LEEDS-01",
          },
        ],
      } satisfies ProviderFirmOfficeListDto),
    ).to.throw(MissingFirmNameError);
  });

  it("throws NoAvailableOfficesError when offices are missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffices({
        firm: {
          firmName: "Acme Legal LLP",
        },
      } satisfies ProviderFirmOfficeListDto),
    ).to.throw(NoAvailableOfficesError);
  });

  it("throws NoAvailableOfficesError when offices are empty", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffices({
        firm: {
          firmName: "Acme Legal LLP",
        },
        offices: [],
      } satisfies ProviderFirmOfficeListDto),
    ).to.throw(NoAvailableOfficesError);
  });

  it("throws InvalidOfficeError when firm office code is missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffices({
        firm: {
          firmName: "Acme Legal LLP",
        },
        offices: [
          {
            addressLine1: "1 High Street",
          },
        ],
      } satisfies ProviderFirmOfficeListDto),
    ).to.throw(InvalidOfficeError);
  });

  it("throws InvalidOfficeError when all address parts are missing", () => {
    sinon.stub(logger, "error");

    expect(() =>
      mapAvailableOffices({
        firm: {
          firmName: "Acme Legal LLP",
        },
        offices: [
          {
            firmOfficeCode: "LEEDS-01",
          },
        ],
      } satisfies ProviderFirmOfficeListDto),
    ).to.throw(InvalidOfficeError);
  });
});