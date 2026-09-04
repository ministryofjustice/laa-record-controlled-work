import { TestRenderResult } from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import sinon from "sinon";

import { viewApplicationEffectsRegistry } from "#/journeys/view-application/viewApplication.effects.js";
import { viewApplicationJourney } from "#/journeys/view-application/viewApplication.journey.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClient } from "#tests/integration/utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

describe("View recorded client details step", () => {
  const mockData = getGetApplicationResponseMock();
  const uuid = "123e4567-e89b-12d3-a456-426614174000";

  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });

  const client = createForgeTestClient(
    viewApplicationJourney,
    viewApplicationEffectsRegistry,
    {
      dependencies: { getApplication: getApplicationStub },
    },
  );

  const session = {};

  beforeEach(() => {
    getApplicationStub.resetHistory();
    getApplicationStub.resetBehavior();
    getApplicationStub.resolves({ status: 200, data: mockData });
  });

  describe("GET /cases/123e4567-e89b-12d3-a456-426614174000/view/client-details", () => {
    let renderResult: TestRenderResult;

    before(async () => {
      getApplicationStub.resolves({ status: 200, data: mockData });
      const result = await client.get(`/cases/${uuid}/view/client-details`, {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
    });

    it("renders the client name as the heading", () => {
      const heading = renderResult
        .getBlocksByVariant("html")
        .find((b) =>
          String(b.properties.classes).includes("govuk-heading-xl"),
        ) as RenderBlock;

      const clientName = `${mockData.clientDetails.firstName} ${mockData.clientDetails.lastName}`;
      expect(heading?.properties.content).to.equal(clientName);
    });

    it("renders the reference number", () => {
      const referenceNumber = renderResult
        .getBlocksByVariant("html")
        .find((b) =>
          String(b.properties.content).includes("Reference number:"),
        ) as RenderBlock;

      expect(referenceNumber).to.exist;
    });

    it("renders the recorded on date", () => {
      const recordedOnDate = new Date(mockData.modifiedAt).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        },
      );
      const recordedOn = renderResult
        .getBlocksByVariant("html")
        .find((b) =>
          String(b.properties.content).includes("Recorded on:"),
        ) as RenderBlock;
      expect(recordedOn).to.exist;
      expect(recordedOn?.properties.content).to.include(recordedOnDate);
    });

    it("renders the status tag", () => {
      const statusTag = renderResult
        .getBlocksByVariant("html")
        .find((b) =>
          String(b.properties.content).includes("govuk-tag--purple"),
        ) as RenderBlock;
      expect(statusTag).to.exist;
      expect(statusTag.properties.content).to.include("Recorded");
    });

    it("renders the print button", () => {
      const printButton = renderResult
        .getBlocksByVariant("govukButton")
        .find((b) => b.properties.text === "Print this case");
      expect(printButton).to.exist;
    });

    it("renders the subnavigation", () => {
      const subNavigation = renderResult
        .getBlocksByVariant("mojSubNavigation");
      expect(subNavigation).to.exist;
      const items = subNavigation[0].properties.items as {
        text: string;
        href: string;
        active?: boolean;
      }[];
      expect(items[0].text).to.equal("Client and case details");
      expect(items[0].href).to.equal("client-details");
      expect(items[0].active).to.equal(true);
      expect(items[1].text).to.equal("Means Assessment");
      expect(items[1].href).to.equal("means-assessment");
      expect(items[2].text).to.equal("Evidence");
      expect(items[2].href).to.equal("evidence");
    });

    it("renders the client details panel", () => {
      const clientDetailsPanel = renderResult
        .getBlocksByVariant("govukSummaryList")
        .find((b) =>
          String((b.properties.card as { title: { text: string } }).title.text).includes(
            "About the client",
          ),
        ) as RenderBlock;

      expect(clientDetailsPanel).to.exist;
    });

    it("renders the case details panel", () => {
      const caseDetailsPanel = renderResult
        .getBlocksByVariant("govukSummaryList")
        .find((b) =>
          String((b.properties.card as { title: { text: string } }).title.text).includes(
            "Case details",
          ),
        ) as RenderBlock;
      expect(caseDetailsPanel).to.exist;
    });
  });
});
