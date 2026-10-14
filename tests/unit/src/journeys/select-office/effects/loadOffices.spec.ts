import * as Sentry from "@sentry/node";
import { expect } from "chai";
import sinon from "sinon";

import { AuthenticationError } from "#/auth/auth.errors.js";
import { getPdaApiDefaultOptions } from "#/api/clients/getPdaApiDefaultOptions.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";
import {
  InvalidSessionError,
  NoAvailableOfficesError,
} from "#/journeys/journey.errors.js";
import { loadOffices } from "#/journeys/select-office/effects/loadOffices.js";
import type {
  Office,
  SelectOfficeContext,
  SelectOfficeEffectsDeps,
} from "#/journeys/select-office/select-office.types.js";
import { logger } from "#/logger.js";

const officeResponse = (
  officeCode: string,
  officeDetails: Record<string, unknown> = {},
) => ({
  firm: { firmName: "Acme Legal LLP" },
  office: {
    addressLine1: "1 High Street",
    city: "Leeds",
    firmOfficeCode: officeCode,
    postCode: "LS1 1AA",
    ...officeDetails,
  },
});

describe("loadOffices", () => {
  let getFirmOffice: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let getRequestHeader: sinon.SinonStub;
  let setData: sinon.SinonStub;
  let deps: SelectOfficeEffectsDeps;
  let context: SelectOfficeContext;

  beforeEach(() => {
    getFirmOffice = sinon.stub();
    getSession = sinon.stub().returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: [] } },
    });
    getRequestHeader = sinon.stub().returns(undefined);
    setData = sinon.stub();
    deps = { getFirmOffice } as unknown as SelectOfficeEffectsDeps;
    context = {
      getSession,
      getRequestHeader,
      setData,
    } as unknown as SelectOfficeContext;
  });

  afterEach(() => sinon.restore());

  it("looks up a scalar claimed office without requiring FIRM_CODE", async () => {
    getSession.returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: "AB12CD" } },
    });
    getFirmOffice.resolves({
      data: officeResponse("AB12CD"),
      status: 200,
    });

    await loadOffices(deps)(context);

    expect(
      getFirmOffice.calledOnceWithExactly(
        "AB12CD",
        getPdaApiDefaultOptions(undefined),
      ),
    ).to.equal(true);
    expect(
      setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.availableOffices, [
        {
          address: "1 High Street, Leeds, LS1 1AA",
          code: "AB12CD",
          firmName: "Acme Legal LLP",
        },
      ]),
    ).to.equal(true);
  });

  it("requests distinct offices once in claim order despite a mismatched FIRM_CODE", async () => {
    getSession.returns({
      account: {
        idTokenClaims: {
          FIRM_CODE: 999,
          LAA_ACCOUNTS: ["AB12CD", "EF34GH", "AB12CD"],
        },
      },
    });
    getFirmOffice.callsFake(async (officeCode: string) => ({
      data: officeResponse(officeCode),
      status: 200,
    }));

    await loadOffices(deps)(context);

    expect(getFirmOffice.getCalls().map((call) => call.args[0])).to.deep.equal([
      "AB12CD",
      "EF34GH",
    ]);
    const offices = setData.firstCall.args[1] as Office[];
    expect(offices.map(({ code }) => code)).to.deep.equal([
      "AB12CD",
      "EF34GH",
    ]);
  });

  it("forwards the correlation ID without forwarding claims", async () => {
    const correlationId = "test-correlation-id";
    getRequestHeader.withArgs("x-correlation-id").returns(correlationId);
    getSession.returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: ["AB12CD", "EF34GH"] } },
    });
    getFirmOffice.callsFake(async (officeCode: string) => ({
      data: officeResponse(officeCode),
      status: 200,
    }));

    await loadOffices(deps)(context);

    expect(getFirmOffice.callCount).to.equal(2);
    for (const call of getFirmOffice.getCalls()) {
      expect(call.args[1]).to.deep.equal(
        getPdaApiDefaultOptions(correlationId),
      );
    }
  });

  it("preserves claim order when requests resolve out of order", async () => {
    const officeCodes = ["AB12CD", "EF34GH"];
    const resolvers = new Map<
      string,
      (response: { data: unknown; status: number }) => void
    >();
    getSession.returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: officeCodes } },
    });
    getFirmOffice.callsFake(
      (officeCode: string) =>
        new Promise((resolve) => resolvers.set(officeCode, resolve)),
    );

    const pending = loadOffices(deps)(context);
    resolvers.get("EF34GH")?.({ data: officeResponse("EF34GH"), status: 200 });
    resolvers.get("AB12CD")?.({ data: officeResponse("AB12CD"), status: 200 });
    await pending;

    const offices = setData.firstCall.args[1] as Office[];
    expect(offices.map(({ code }) => code)).to.deep.equal(officeCodes);
  });

  [
    { name: "204 response", response: { data: null, status: 204 } },
    { name: "HTTP error", response: { data: null, status: 500 } },
    { name: "malformed response", response: { data: null, status: 200 } },
    {
      name: "missing display details",
      response: {
        data: officeResponse("AB12CD", {
          addressLine1: null,
          city: null,
          postCode: null,
        }),
        status: 200,
      },
    },
    {
      name: "mismatched returned office code",
      response: { data: officeResponse("ZX98QW"), status: 200 },
    },
  ].forEach(({ name, response }) =>
    it(`keeps the office selectable after a ${name}`, async () => {
      sinon.stub(logger, "error");
      getSession.returns({
        account: { idTokenClaims: { LAA_ACCOUNTS: "AB12CD" } },
      });
      getFirmOffice.resolves(response);

      await loadOffices(deps)(context);

      expect(
        setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.availableOffices, [
          { code: "AB12CD" },
        ]),
      ).to.equal(true);
    }),
  );

  it("keeps the requested office selectable after a network error", async () => {
    sinon.stub(logger, "error");
    const distributionStub = sinon.stub(Sentry.metrics, "distribution");
    getSession.returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: "AB12CD" } },
    });
    getFirmOffice.rejects(new Error("network error"));

    await loadOffices(deps)(context);

    expect(
      setData.calledOnceWithExactly(CONTEXT_DATA_KEYS.availableOffices, [
        { code: "AB12CD" },
      ]),
    ).to.equal(true);
    expect(
      distributionStub.calledWithMatch(
        "api_response_time",
        sinon.match.number,
        { attributes: { endpoint: "getFirmOffice", outcome: "error" } },
      ),
    ).to.equal(true);
    expect(distributionStub.calledOnce).to.equal(true);
  });

  it("retains every claimed code when some office lookups fail", async () => {
    sinon.stub(logger, "error");
    getSession.returns({
      account: {
        idTokenClaims: { LAA_ACCOUNTS: ["AB12CD", "EF34GH", "JK56LM"] },
      },
    });
    getFirmOffice.callsFake(async (officeCode: string) => {
      if (officeCode === "EF34GH") {
        return { data: null, status: 500 };
      }
      if (officeCode === "JK56LM") {
        return { data: officeResponse("ZX98QW"), status: 200 };
      }
      return { data: officeResponse(officeCode), status: 200 };
    });

    await loadOffices(deps)(context);

    const offices = setData.firstCall.args[1] as Office[];
    expect(offices).to.deep.equal([
      {
        address: "1 High Street, Leeds, LS1 1AA",
        code: "AB12CD",
        firmName: "Acme Legal LLP",
      },
      { code: "EF34GH" },
      { code: "JK56LM" },
    ]);
    expect(setData.calledOnce).to.equal(true);
  });

  it("retains all claimed codes when every office lookup fails", async () => {
    sinon.stub(logger, "error");
    const officeCodes = ["AB12CD", "EF34GH"];
    getSession.returns({
      account: { idTokenClaims: { LAA_ACCOUNTS: officeCodes } },
    });
    getFirmOffice.rejects(new Error("PDA unavailable"));

    await loadOffices(deps)(context);

    const offices = setData.firstCall.args[1] as Office[];
    expect(offices).to.deep.equal(officeCodes.map((code) => ({ code })));
  });

  it("throws NoAvailableOfficesError when membership is empty", async () => {
    await loadOffices(deps)(context).then(
      () => expect.fail("Expected empty membership to fail"),
      (error) => expect(error).to.be.instanceOf(NoAvailableOfficesError),
    );

    expect(getFirmOffice.notCalled).to.equal(true);
    expect(setData.notCalled).to.equal(true);
  });

  it("throws InvalidSessionError when the session is missing", async () => {
    getSession.returns(undefined);

    await loadOffices(deps)(context).then(
      () => expect.fail("Expected missing session to fail"),
      (error) => expect(error).to.be.instanceOf(InvalidSessionError),
    );
    expect(getFirmOffice.notCalled).to.equal(true);
  });

  [undefined, 123].forEach((claim) =>
    it("throws AuthenticationError when LAA_ACCOUNTS is invalid", async () => {
      getSession.returns({
        account: { idTokenClaims: { LAA_ACCOUNTS: claim } },
      });

      await loadOffices(deps)(context).then(
        () => expect.fail("Expected invalid claim to fail"),
        (error) => expect(error).to.be.instanceOf(AuthenticationError),
      );
      expect(getFirmOffice.notCalled).to.equal(true);
    }),
  );
});
