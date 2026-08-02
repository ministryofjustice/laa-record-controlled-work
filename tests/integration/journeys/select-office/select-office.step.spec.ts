import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { faker } from "@faker-js/faker";
import sinon from "sinon";

import { getGetAllProviderOfficesResponseMock } from "../../../mocks/api/pda/fakers/provider-firms-endpoints/provider-firms-endpoints.faker.gen.js";
import { createForgeTestClientForSelectOffice } from "../../utils/helpers.js";

faker.seed(12345);

const mockResponse = getGetAllProviderOfficesResponseMock();
const mockOffices = mockResponse.offices!;

const session = {
  account: {
    idTokenClaims: {
      FIRM_CODE: 12345,
    },
  },
};

describe("Select Office step", () => {
  let getAllProviderOfficesStub: sinon.SinonStub;
  let client: ReturnType<typeof createForgeTestClientForSelectOffice>;

  before(() => {
    getAllProviderOfficesStub = sinon
      .stub()
      .resolves({ status: 200, data: mockResponse });

    client = createForgeTestClientForSelectOffice({
      getAllProviderOffices: getAllProviderOfficesStub,
    });
  });

  after(() => {
    sinon.restore();
  });

  describe("GET /select-office/", () => {
    let renderResult: TestRenderResult;

    before(async () => {
      const result = await client.get("/select-office/", { session });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    afterEach(() => {
      getAllProviderOfficesStub.resolves({ status: 200, data: mockResponse });
    });

    it("has the correct title", () => {
      expect(renderResult.context.step.title).to.equal(
        "Select the office you're recording cases from",
      );
    });

    it("renders a radio input with the loaded offices", () => {
      const [radioInput] = renderResult.getBlocksByVariant("govukRadioInput");
      const radioItems = radioInput.properties.items as {
        text: string;
        value: string;
        hint: { text: string };
      }[];

      expect(getAllProviderOfficesStub.calledOnce).to.equal(true);
      expect(radioItems).to.have.length(mockOffices.length);

      for (const [i, office] of mockOffices.entries()) {
        const addressParts = [
          office.addressLine1,
          office.addressLine2,
          office.addressLine3,
          office.addressLine4,
          office.city,
          office.postCode,
        ].filter(Boolean);

        expect(radioItems[i].text).to.equal(addressParts.join(", "));
        expect(radioItems[i].value).to.equal(office.firmOfficeCode);
        expect(radioItems[i].hint.text).to.equal(office.firmOfficeCode);
      }
    });

      it("redirects straight to /cases when only one office is returned", async () => {
        const singleOfficeResponse = getGetAllProviderOfficesResponseMock({
          offices: [mockOffices[0]],
        });
        getAllProviderOfficesStub.resolves({
          status: 200,
          data: singleOfficeResponse,
        });
        const result = await client.get("/select-office/", { session });
        expect(result.type).to.equal("redirect");
        expect((result as TestRedirectResult).url).to.equal("/cases");
      });
  });

  describe("POST /select-office/", () => {
    afterEach(() => {
      getAllProviderOfficesStub.resolves({ status: 200, data: mockResponse });
    });

    it("shows a validation error when no office is selected", async () => {
      const result = await client.post("/select-office/", { session });
      expect(result.type).to.equal("render");
      const renderResult = result as TestRenderResult;
      expect(renderResult.context.showValidationFailures).to.equal(true);
      expect(
        renderResult.getValidationErrorsByFieldCode("selectOffice")[0].message,
      ).to.equal("Select the office you're recording cases from");
    });

    it("redirects to /cases after a valid office is selected", async () => {
      const result = await client.post("/select-office/", {
        session,
        body: { selectOffice: mockOffices[0].firmOfficeCode },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases");
    });
  });
});
