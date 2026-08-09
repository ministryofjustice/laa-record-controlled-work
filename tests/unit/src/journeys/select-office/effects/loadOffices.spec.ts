import { expect } from "chai";
import sinon from "sinon";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import { ApiResponseError, ApiValidationError } from "#/api/clients/api.errors.js";
import { getPdaApiDefaultOptions } from "#/api/clients/getPdaApiDefaultOptions.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidFirmCodeClaimError,
} from "#/journeys/journey.errors.js";
import { loadOffices } from "#/journeys/select-office/effects/loadOffices.js";
import type {
  SelectOfficeContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

describe("loadOffices", () => {
  let getAllProviderOffices: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let getRequestHeader: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let deps: SelectOfficeEffectsDeps;
  let context: SelectOfficeContext;

  const FIRM_CODE = 123;
  
  beforeEach(() => {
    getAllProviderOffices = sinon.stub();
    getSession = sinon.stub().returns({
      account: {
        idTokenClaims: {
          FIRM_CODE,
        },
      },
    });
    getRequestHeader = sinon.stub().returns(undefined);
    setData = sinon.stub();
    deps = {
      getAllProviderOffices,
    } as unknown as SelectOfficeEffectsDeps;
    context = {
      getSession,
      getRequestHeader,
      setData,
    } as unknown as SelectOfficeContext;
  });

  afterEach(() => sinon.restore());

  it("sets available offices in context when API response is valid", async () => {
    getAllProviderOffices.resolves({
      data: {
        firm: {
          firmName: "Acme Legal LLP",
        },
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
        FIRM_CODE,
        getPdaApiDefaultOptions(),
      ),
    ).to.equal(true);

    expect(setData.calledOnce).to.equal(true);
    expect(setData.firstCall.args[0]).to.equal(CONTEXT_DATA_KEYS.availableOffices);
  });

  it("forwards the x-correlation-id request header to the API call", async () => {
    const correlationId = "test-correlation-id";
    getRequestHeader.withArgs("x-correlation-id").returns(correlationId);
    getAllProviderOffices.resolves({
      data: {
        firm: {
          firmName: "Acme Legal LLP",
        },
        offices: [
          {
            addressLine1: "1 High Street",
            firmOfficeCode: "LEEDS-01",
          },
        ],
      } satisfies ProviderFirmOfficeListDto,
      status: 200,
    });

    await loadOffices(deps)(context);

    expect(
      getAllProviderOffices.calledOnceWithExactly(
        FIRM_CODE,
        getPdaApiDefaultOptions(correlationId),
      ),
    ).to.equal(true);
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

  it("throws InvalidFirmCodeClaimError when FIRM_CODE claim is missing", async () => {
    sinon.stub(logger, "error");
    getSession.returns({
      account: {
        idTokenClaims: {},
      },
    });

    try {
      await loadOffices(deps)(context);
      expect.fail("Expected loadOffices to throw InvalidFirmCodeClaimError");
    } catch (error) {
      expect(error).to.be.instanceOf(InvalidFirmCodeClaimError);
      expect(getAllProviderOffices.notCalled).to.equal(true);
    }
  });
});