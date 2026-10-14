import {
  TestRedirectResult,
  TestRenderResult,
  type ForgeTestClient,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationsResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { selectOfficeEffectsRegistry } from "#/journeys/select-office/select-office.effects.js";
import { selectOfficeJourney } from "#/journeys/select-office/select-office.journey.js";
import { yourCasesEffectsRegistry } from "#/journeys/your-cases/your-cases.effects.js";
import { yourCasesJourney } from "#/journeys/your-cases/your-cases.journey.js";

const officeCodes = ["AB12CD", "EF34GH"];
const session = {
  account: { idTokenClaims: { LAA_ACCOUNTS: officeCodes } },
};

function officeResponse(officeCode: string) {
  return {
    firm: { firmName: "Acme Legal LLP" },
    office: {
      addressLine1: "1 High Street",
      city: "Leeds",
      firmOfficeCode: officeCode,
      postCode: "LS1 1AA",
    },
  };
}

describe("Select Office step", () => {
  let getFirmOfficeStub: sinon.SinonStub;
  let getApplicationsStub: sinon.SinonStub;
  let client: ForgeTestClient;
  let yourCasesClient: ForgeTestClient;

  before(() => {
    getFirmOfficeStub = sinon.stub().callsFake(async (officeCode: string) => ({
      status: 200,
      data: officeResponse(officeCode),
    }));

    client = createForgeTestClient(
      selectOfficeJourney,
      selectOfficeEffectsRegistry,
      { dependencies: { getFirmOffice: getFirmOfficeStub } },
    );
    getApplicationsStub = sinon.stub().resolves({
      status: 200,
      data: getGetApplicationsResponseMock(),
    });
    yourCasesClient = createForgeTestClient(
      yourCasesJourney,
      yourCasesEffectsRegistry,
      { dependencies: { getApplications: getApplicationsStub } },
    );
  });

  after(() => sinon.restore());

  afterEach(() => {
    getFirmOfficeStub.callsFake(async (officeCode: string) => ({
      status: 200,
      data: officeResponse(officeCode),
    }));
  });

  describe("GET /select-office/", () => {
    it("has the correct title and renders addressed offices with code hints", async () => {
      const result = await client.get("/select-office/", { session });
      expect(result.type).to.equal("render");

      const renderResult = result as TestRenderResult;
      expect(renderResult.context.step.title).to.equal(
        "Select the office you're recording cases from",
      );
      const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
      const radioItems = radioInput.properties.items as {
        text: string;
        value: string;
        hint?: { text: string } | null;
      }[];

      expect(getFirmOfficeStub.callCount).to.equal(2);
      expect(getFirmOfficeStub.getCalls().map((call) => call.args[0])).to.eql(
        officeCodes,
      );
      expect(radioItems).to.have.length(officeCodes.length);
      for (const [index, officeCode] of officeCodes.entries()) {
        expect(radioItems[index].text).to.equal(
          "1 High Street, Leeds, LS1 1AA",
        );
        expect(radioItems[index].value).to.equal(officeCode);
        expect(radioItems[index].hint?.text).to.equal(officeCode);
      }
    });

    it("renders code-only offices without a duplicate hint", async () => {
      getFirmOfficeStub.rejects(new Error("PDA unavailable"));

      const result = await client.get("/select-office/", { session });
      expect(result.type).to.equal("render");

      const renderResult = result as TestRenderResult;
      const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
      const radioItems = radioInput.properties.items as {
        text: string;
        value: string;
        hint?: { text: string } | null;
      }[];

      expect(radioItems.map(({ text }) => text)).to.eql(officeCodes);
      expect(radioItems.map(({ value }) => value)).to.eql(officeCodes);
      expect(radioItems.every(({ hint }) => hint == null)).to.equal(true);
    });

    it("auto-selects a single office after its lookup fails", async () => {
      getFirmOfficeStub.rejects(new Error("PDA unavailable"));
      const singleOfficeSession = {
        account: { idTokenClaims: { LAA_ACCOUNTS: ["AB12CD"] } },
      };

      const result = await client.get("/select-office/", {
        session: singleOfficeSession,
      });

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal("/");
      expect(singleOfficeSession).to.have.property("selectedOffice");
    });
  });

  describe("POST /select-office/", () => {
    it("shows a validation error when no office is selected", async () => {
      const result = await client.post("/select-office/", { session });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode("selectOffice")[0].message,
      ).to.equal("Select the office you're recording cases from");
    });

    it("accepts a code-only office after its lookup fails", async () => {
      getFirmOfficeStub.callsFake(async (officeCode: string) =>
        officeCode === "AB12CD"
          ? Promise.reject(new Error("PDA unavailable"))
          : { status: 200, data: officeResponse(officeCode) },
      );

      const result = await client.post("/select-office/", {
        session,
        body: { selectOffice: "AB12CD" },
      });

      expect(result.type).to.equal("redirect");
      expect((result as TestRedirectResult).url).to.equal("/");
    });

    it("keeps a failed-lookup selection in session for all code-scoped case lists", async () => {
      getFirmOfficeStub.callsFake(async (officeCode: string) =>
        officeCode === "AB12CD"
          ? Promise.reject(new Error("PDA unavailable"))
          : { status: 200, data: officeResponse(officeCode) },
      );
      const selectionSession = {
        account: { idTokenClaims: { LAA_ACCOUNTS: officeCodes } },
      };

      const selection = await client.post("/select-office/", {
        session: selectionSession,
        body: { selectOffice: "AB12CD" },
      });

      expect(selection.type).to.equal("redirect");
      expect(selectionSession).to.have.property("selectedOffice").that.deep.equals({
        code: "AB12CD",
      });

      for (const [path, status] of [
        ["/cases", "DRAFT"],
        ["/cases/recorded", "COMPLETED"],
        ["/cases/ineligible", "COMPLETED"],
      ]) {
        getApplicationsStub.resetHistory();
        const result = await yourCasesClient.get(path, {
          session: selectionSession,
        });

        expect(result.type).to.equal("render");
        expect(getApplicationsStub.calledOnce).to.equal(true);
        expect(
          getApplicationsStub.calledWithMatch({
            officeId: "AB12CD",
            status,
          }),
        ).to.equal(true);
      }
    });
  });
});
