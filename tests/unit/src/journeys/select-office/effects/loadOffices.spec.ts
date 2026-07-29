import { expect } from "chai";
import sinon from "sinon";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import { ApiResponseError, ApiValidationError } from "#/api/api.errors.js";
import { getPdaApiDefaultOptions } from "#/api/getPdaApiDefaultOptions.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import { loadOffices } from "#/journeys/select-office/effects/loadOffices.js";
import type {
  OfficesContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

describe("loadOffices", () => {
  let getAllProviderOffices: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let deps: SelectOfficeEffectsDeps;
  let context: OfficesContext;

  beforeEach(() => {
    getAllProviderOffices = sinon.stub();
    setData = sinon.stub();
    deps = {
      getAllProviderOffices,
    } as unknown as SelectOfficeEffectsDeps;
    context = {
      setData,
    } as unknown as OfficesContext;
  });

  afterEach(() => sinon.restore());

  it("loads mapped offices into context", async () => {
    getAllProviderOffices.resolves({
      data: {
        offices: [
          {
            addressLine1: "1 High Street",
            city: "Leeds",
            postCode: "LS1 1AA",
            firmOfficeCode: "LEEDS-01",
            officeName: "Leeds Office",
          },
        ],
      } satisfies ProviderFirmOfficeListDto,
      status: 200,
    });

    await loadOffices(deps)(context);

    expect(
      getAllProviderOffices.calledOnceWithExactly(
        123,
        getPdaApiDefaultOptions(),
      ),
    ).to.equal(true);
    
    expect(setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.officeList, [
      {
        address: "1 High Street, Leeds, LS1 1AA",
        code: "LEEDS-01",
        officeName: "Leeds Office",
      },
    ])).to.equal(true);
  });

  it("sets an empty office list when the response does not include offices", async () => {
    getAllProviderOffices.resolves({
      data: {} satisfies ProviderFirmOfficeListDto,
      status: 200,
    });

    await loadOffices(deps)(context);

    expect(setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.officeList, [])).to
      .equal(true);
  });

  it("throws ApiResponseError when getAllProviderOffices rejects", async () => {
    sinon.stub(logger, "error");
    const cause = new Error("network error");
    getAllProviderOffices.rejects(cause);

    try {
      await loadOffices(deps)(context);
      expect.fail("Expected loadOffices to throw ApiResponseError");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
      expect((error as ApiResponseError).cause).to.equal(cause);
    }
  });

  it("throws ApiResponseError when getAllProviderOffices returns a non-200 status", async () => {
    sinon.stub(logger, "error");
    getAllProviderOffices.resolves({
      data: {},
      status: 500,
    });

    try {
      await loadOffices(deps)(context);
      expect.fail("Expected loadOffices to throw ApiResponseError");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  it("throws ApiValidationError when API response data fails schema validation", async () => {
    sinon.stub(logger, "error");
    getAllProviderOffices.resolves({
      data: {
        offices: "not-an-array",
      },
      status: 200,
    });

    try {
      await loadOffices(deps)(context);
      expect.fail("Expected loadOffices to throw ApiValidationError");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiValidationError);
    }
  });
});