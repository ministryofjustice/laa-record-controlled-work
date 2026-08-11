import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import sinon from "sinon";

import { getGetApplicationResponseMock } from "#/api/mocks/rcw/fakers/applications/applications.faker.gen.js";
import { createForgeTestClientForEditApplication } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";

type RenderedTaskListItem = {
  title: { text: string };
  href?: string | null;
  status: { text?: string; tag?: { text?: string } | null };
};

describe("Task list step", () => {
  const uuid = "123e4567-e89b-12d3-a456-426614174000";
  const meansAssessmentId = "123e4567-e89b-12d3-a456-426614174111";
  const mockData = getGetApplicationResponseMock();
  const getApplicationStub = sinon
    .stub()
    .resolves({ status: 200, data: mockData });

  const client = createForgeTestClientForEditApplication({
    getApplication: getApplicationStub,
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
        `Reference number: ${mockData.id}`,
      );
    });

    it("renders 3 task list sections", () => {
      expect(taskLists.length).to.equal(3);
    });

    describe("declaration status rendering", () => {
      it("renders declaration as Completed when declaration data is present", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            meansAssessmentId,
            evidence: {
              evidenceStatus: "DRAFT",
              payeIncomeEvidence: true,
              otherIncomeEvidence: true,
              housingCostsEvidence: true,
              capitalEvidence: true,
            },
            declaration: {
              clientDeclarationStatus: "DRAFT",
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

        expect(declarationItem.href).to.equal("client-declaration-TODO");
        expect(declarationItem.status.text).to.equal("Completed");
        expect(declarationItem.status.tag).to.equal(null);
      });

      it("renders declaration as Incomplete when declaration data is empty", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            meansAssessmentId,
            evidence: {
              evidenceStatus: "DRAFT",
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

        expect(declarationItem.href).to.equal("client-declaration-TODO");
        expect(declarationItem.status.tag?.text).to.equal("Incomplete");
        expect(declarationItem.status.text).to.equal("");
      });

      it("renders declaration as Cannot start yet when evidence is not complete", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            meansAssessmentId,
            evidence: {},
            declaration: {
              clientDeclarationStatus: "DRAFT",
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
    it("redirects to the case list", async () => {
      const result = await client.post(`/cases/${uuid}/task-list`, {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/case-list");
    });
  });
});
