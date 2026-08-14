import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { editApplicationEffectsRegistry } from "#/journeys/edit-application/editApplication.effects.js";
import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";

type RenderedTaskListItem = {
  title: { text: string };
  href?: string | null;
  status: { text?: string; tag?: { text?: string } | null };
};

describe("Task list step", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const eligibilityResult = {
    result: {
      result_summary: { overall_result: { result: "eligible" } },
    },
  };
  const mockData = getGetApplicationResponseMock();
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });

  const client = createTestClient({
    mockDeps: { getApplication: getApplicationStub },
    path: "/cases/:applicationID/",
    steps: [taskListStep()],
    testEffects: editApplicationEffectsRegistry,
  });
  const session = {};

  beforeEach(() => {
    getApplicationStub.resetHistory();
    getApplicationStub.resetBehavior();
    getApplicationStub.resolves({ status: 200, data: mockData });
  });

  describe("GET /cases/123e4567-e89b-12d3-a456-426614174000/task-list", () => {
    let renderResult: TestRenderResult;
    let heading: RenderBlock;
    let body: RenderBlock;
    let taskLists: RenderBlock[];
    let submitButton: RenderBlock;

    const getEvidenceAndDeclarationItems = (lists: RenderBlock[]) =>
      lists[2].properties.items as RenderedTaskListItem[];

    before(async () => {
      getApplicationStub.resolves({ status: 200, data: mockData });
      const result = await client.get(`/cases/${uuid}/task-list`, {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [heading, body] = renderResult.getBlocksByVariant("html");
      taskLists = renderResult.getBlocksByVariant("govukTaskList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("renders the client name as the heading", () => {
      const clientName = `${mockData.clientDetails.firstName} ${mockData.clientDetails.lastName}`;
      expect(heading.properties.content).to.equal(clientName);
    });

    it("renders the reference number", () => {
      expect(body.properties.content).to.equal(
        `Reference number: ${mockData.applicationRefNumber}`,
      );
    });

    it("renders 3 task list sections", () => {
      expect(taskLists.length).to.equal(3);
    });

    it("renders an eligibility result indicator without content for an ineligible assessment", async () => {
      getApplicationStub.resolves({
        status: 200,
        data: getGetApplicationResponseMock({
          eligibility: {
            result: {
              result_summary: { overall_result: { result: "ineligible" } },
            },
          },
        }),
      });

      const result = await client.get(`/cases/${uuid}/task-list`, {
        session: {},
      });

      expect(result.type).to.equal("render");
      const eligibilityResultRender = result as TestRenderResult;
      const indicators = eligibilityResultRender
        .getBlocksByVariant("html")
        .filter((block) =>
          String(block.properties.content).includes("Eligibility result"),
        );

      expect(indicators).to.have.length(1);
      const indicator = String(indicators[0].properties.content);
      expect(indicator).to.include("Eligibility result");
      expect(indicator).to.not.include(
        "Your client qualifies financially for civil legal aid",
      );
      expect(indicator).to.include(
        `href="/cases/${uuid}/eligibility/"`,
      );
      expect(indicator).to.include("View result");
    });

    it("does not render an eligibility result indicator when no result is available", async () => {
      getApplicationStub.resolves({
        status: 200,
        data: getGetApplicationResponseMock({
          eligibility: { result: {} },
        }),
      });

      const result = await client.get(`/cases/${uuid}/task-list`, {
        session: {},
      });

      expect(result.type).to.equal("render");
      const eligibilityResultRender = result as TestRenderResult;
      const indicators = eligibilityResultRender
        .getBlocksByVariant("html")
        .filter((block) =>
          String(block.properties.content).includes("Eligibility result"),
        );

      expect(indicators).to.have.length(0);
    });

    it("renders eligibility content for an eligible assessment", async () => {
      getApplicationStub.resolves({
        status: 200,
        data: getGetApplicationResponseMock({
          eligibility: eligibilityResult,
        }),
      });

      const result = await client.get(`/cases/${uuid}/task-list`, {
        session: {},
      });

      expect(result.type).to.equal("render");
      const eligibilityResultRender = result as TestRenderResult;
      const indicators = eligibilityResultRender
        .getBlocksByVariant("html")
        .filter((block) =>
          String(block.properties.content).includes("Eligibility result"),
        );

      expect(indicators).to.have.length(1);
      const indicator = String(indicators[0].properties.content);
      expect(indicator).to.include("Eligibility result");
      expect(indicator).to.include(
        "Your client qualifies financially for civil legal aid based on the information you entered.",
      );
      expect(indicator).to.include(
        `href="/cases/${uuid}/eligibility/"`,
      );
      expect(indicator).to.include("View result");
    });

    describe("declaration status rendering", () => {
      it("renders declaration as Completed when declaration data is present", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            eligibility: eligibilityResult,
            evidence: {
              payeIncomeEvidence: true,
              otherIncomeEvidence: true,
              housingCostsEvidence: true,
              capitalEvidence: true,
            },
            declaration: {
              declarationConfirmation: true,
            },
          }),
        });

        const result = await client.get(`/cases/${uuid}/task-list`, {
          session: {},
        });

        expect(result.type).to.equal("render");
        const declarationRender = result as TestRenderResult;
        const lists = declarationRender.getBlocksByVariant("govukTaskList");
        const evidenceAndDeclarationItems =
          getEvidenceAndDeclarationItems(lists);
        const declarationItem = evidenceAndDeclarationItems[1];

        expect(declarationItem.href).to.equal(`/cases/${uuid}/declaration/`);
        expect(declarationItem.status.text).to.equal("Completed");
        expect(declarationItem.status.tag).to.equal(null);
      });

      it("renders declaration as Incomplete when declaration data is empty", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            eligibility: eligibilityResult,
            evidence: {
              payeIncomeEvidence: true,
              otherIncomeEvidence: true,
              housingCostsEvidence: true,
              capitalEvidence: true,
            },
            declaration: {},
          }),
        });

        const result = await client.get(`/cases/${uuid}/task-list`, {
          session: {},
        });

        expect(result.type).to.equal("render");
        const declarationRender = result as TestRenderResult;
        const lists = declarationRender.getBlocksByVariant("govukTaskList");
        const evidenceAndDeclarationItems =
          getEvidenceAndDeclarationItems(lists);
        const declarationItem = evidenceAndDeclarationItems[1];

        expect(declarationItem.href).to.equal(`/cases/${uuid}/declaration/`);
        expect(declarationItem.status.tag?.text).to.equal("Incomplete");
        expect(declarationItem.status.text).to.equal("");
      });

      it("renders declaration as Cannot start yet when evidence is not complete", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            eligibility: eligibilityResult,
            evidence: {},
            declaration: {
              declarationConfirmation: true,
            },
          }),
        });

        const result = await client.get(`/cases/${uuid}/task-list`, {
          session: {},
        });

        expect(result.type).to.equal("render");
        const declarationRender = result as TestRenderResult;
        const lists = declarationRender.getBlocksByVariant("govukTaskList");
        const evidenceAndDeclarationItems =
          getEvidenceAndDeclarationItems(lists);
        const declarationItem = evidenceAndDeclarationItems[1];

        expect(declarationItem.href).to.equal(null);
        expect(declarationItem.status.text).to.equal("Cannot start yet");
        expect(declarationItem.status.tag).to.equal(null);
      });
    });

    it("renders the save and return button", () => {
      expect(submitButton.properties.text).to.equal("Save and return later");
    });
  });

  describe("POST /cases/123e4567-e89b-12d3-a456-426614174000/task-list", () => {
    it("redirects to the cases list", async () => {
      const result = await client.post(`/cases/${uuid}/task-list`, {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases");
    });
  });
});
