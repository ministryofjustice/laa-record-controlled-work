import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { editApplicationJourney } from "#/journeys/edit-application/editApplication.journey.js";

describe("Confirmation step", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const mockData = getGetApplicationResponseMock();
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });
  const updateApplicationStatusStub = sinon.stub().resolves({ status: 204 });

  const client = createForgeTestClient(
    editApplicationJourney,
    editApplicationEffectsRegistry,
    {
      dependencies: {
        getApplication: getApplicationStub,
        updateApplicationStatus: updateApplicationStatusStub,
      },
    },
  );
  const session = {};

  beforeEach(() => {
    getApplicationStub.resetHistory();
    getApplicationStub.resetBehavior();
    getApplicationStub.resolves({ status: 200, data: mockData });
  });

  describe("GET /cases/123e4567-e89b-12d3-a456-426614174000/confirmation", () => {
    let renderResult: TestRenderResult;
    let panel: RenderBlock;
    let body: RenderBlock;

    before(async () => {
      getApplicationStub.resolves({ status: 200, data: mockData });
      const result = await client.get(`/cases/${uuid}/confirmation`, {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [panel] = renderResult.getBlocksByVariant("govukPanel");
    });

    it("renders the alert panel with the correct content", () => {
      expect(panel.properties.titleText).to.include("Controlled work recorded");
      expect(panel.properties.html).to.include(
        "Reference number",
      );
      expect(panel.properties.html).to.include(
        `${mockData.applicationRefNumber}`,
      );
    });

    it("renders the correct heading content", () => {
      const heading = renderResult
        .getBlocksByVariant("html")
        .find(
          (block) =>
            typeof block.properties.content === "string" &&
            block.properties.content.includes("What happens next"),
        );
      expect(heading).to.not.equal(undefined);
    });

    it("renders the correct body content", () => {
      const body = renderResult
        .getBlocksByVariant("html")
        .find(
          (block) =>
            typeof block.properties.content === "string" &&
            block.properties.content.includes(
              "The LAA will store the details you've provided",
            ),
        );
      expect(body).to.not.equal(undefined);
    });
  });

  describe(`POST /cases/${uuid}/confirmation`, () => {
    it("redirects to the cases page", async () => {
      const result = await client.post(`/cases/${uuid}/confirmation`, {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;

      expect(redirectResult.url).to.equal(`/cases`);
    });
  });
});
