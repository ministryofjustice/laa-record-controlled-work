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
  const updateApplicationStatusStub = sinon
    .stub()
    .resolves({ status: 204, data: undefined });

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

  describe("GET /cases/123e4567-e89b-12d3-a456-426614174000/task-list", () => {
    let renderResult: TestRenderResult;
    let heading: RenderBlock;
    let body: RenderBlock;
    let taskLists: RenderBlock[];
    let buttonGroupBlock: RenderBlock;

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
      [buttonGroupBlock] = renderResult.getBlocksByVariant("templateWrapper");
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

    it("renders the ineligible result and hides evidence and declaration", async () => {
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
      const lists = eligibilityResultRender
        .getBlocksByVariant("govukTaskList")
        .filter((block) => block.properties.visibleWhen !== false);
      const indicators = eligibilityResultRender
        .getBlocksByVariant("html")
        .filter((block) => block.properties.visibleWhen !== false)
        .filter((block) =>
          String(block.properties.content).includes("Eligibility result"),
        );

      expect(indicators).to.have.length(1);
      const indicator = String(indicators[0].properties.content);
      expect(indicator).to.include("Eligibility result");
      expect(indicator).to.include(
        "Your client does not qualify financially for civil legal aid based on the information you entered.",
      );
      expect(lists).to.have.length(2);
      expect(
        eligibilityResultRender
          .getBlocksByVariant("html")
          .filter((block) => block.properties.visibleWhen !== false)
          .some((block) =>
            String(block.properties.content).includes("Evidence and Declaration"),
          ),
      ).to.equal(false);
      expect(
        Object.values(
          (eligibilityResultRender.getBlocksByVariant("templateWrapper")[0]
            .properties.slots ?? {}) as Record<string, RenderBlock[]>,
        )
          .flat()
          .some(
            (block) =>
              block.properties.visibleWhen !== false &&
              block.properties.text === "Close case",
          ),
      ).to.equal(true);
      expect(indicator).to.include(
        `href="/cases/${uuid}/eligibility/?destination=check-result"`,
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
        `href="/cases/${uuid}/eligibility/?destination=check-result"`,
      );
      expect(indicator).to.include("View result");
    });

    describe("means assessment status rendering", () => {
      it("links to the CCQ landing with a check-answers destination when completed", async () => {
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
        const meansAssessmentRender = result as TestRenderResult;
        const lists = meansAssessmentRender.getBlocksByVariant("govukTaskList");
        const meansAssessmentItems = lists[1].properties
          .items as RenderedTaskListItem[];
        const meansAssessmentItem = meansAssessmentItems[0];

        expect(meansAssessmentItem.href).to.equal(
          `/cases/${uuid}/eligibility/?destination=check-answers`,
        );
        expect(meansAssessmentItem.status.text).to.equal("Completed");
      });

      it("links to the CCQ landing without a destination when incomplete", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            eligibility: {},
          }),
        });

        const result = await client.get(`/cases/${uuid}/task-list`, {
          session: {},
        });

        expect(result.type).to.equal("render");
        const meansAssessmentRender = result as TestRenderResult;
        const lists = meansAssessmentRender.getBlocksByVariant("govukTaskList");
        const meansAssessmentItems = lists[1].properties
          .items as RenderedTaskListItem[];
        const meansAssessmentItem = meansAssessmentItems[0];

        expect(meansAssessmentItem.href).to.equal(`/cases/${uuid}/eligibility/`);
        expect(meansAssessmentItem.status.tag?.text).to.equal("Incomplete");
      });
    });

    describe("declaration status rendering", () => {
      it("renders declaration as Completed when declaration data is present", async () => {
        getApplicationStub.resolves({
          status: 200,
          data: getGetApplicationResponseMock({
            eligibility: eligibilityResult,
            evidence: {
              evidenceExemptionCode: "something",
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
              evidenceExemptionCode: "something",
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
      const slots = buttonGroupBlock.properties.slots as Record<
        string,
        RenderBlock[]
      >;
      const saveAndReturnBtn = slots.child1[0];
      expect(saveAndReturnBtn.properties.value).to.equal("return");
      expect(saveAndReturnBtn.properties.text).to.equal(
        "Save and return later",
      );
    });

    it("hides the Record Controlled Work button when readyForSubmission is false", async () => {
      getApplicationStub.resolves({
        status: 200,
        data: getGetApplicationResponseMock({ eligibility: {} }),
      });

      const result = await client.get(`/cases/${uuid}/task-list`, {
        session: {},
      });
      expect(result.type).to.equal("render");
      const incompleteRender = result as TestRenderResult;
      const [incompleteButtonGroup] =
        incompleteRender.getBlocksByVariant("templateWrapper");
      const incompleteSlots = incompleteButtonGroup.properties.slots as Record<
        string,
        RenderBlock[]
      >;
      const submitBtn = incompleteSlots.child0[0];
      expect(submitBtn.properties.classes).to.equal("govuk-!-display-none");
    });

    it("shows the Record Controlled Work button when readyForSubmission is true", async () => {
      getApplicationStub.resolves({
        status: 200,
        data: getGetApplicationResponseMock(),
      });

      const result = await client.get(`/cases/${uuid}/task-list`, {
        session: {},
      });
      expect(result.type).to.equal("render");
      const readyRender = result as TestRenderResult;
      const [readyButtonGroup] =
        readyRender.getBlocksByVariant("templateWrapper");
      const readySlots = readyButtonGroup.properties.slots as Record<
        string,
        RenderBlock[]
      >;
      const submitBtn = readySlots.child0[0];
      expect(submitBtn.properties.value).to.equal("submit");
      expect(submitBtn.properties.classes).to.equal("");
    });
  });

  describe("POST /cases/123e4567-e89b-12d3-a456-426614174000/task-list", () => {
    it("redirects to the cases list", async () => {
      const result = await client.post(`/cases/${uuid}/task-list`, {
        session,
        body: { action: "return" },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/cases");
    });

    it("closes an ineligible case when Close case is submitted", async () => {
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

      const result = await client.post(`/cases/${uuid}/task-list`, {
        session: {},
        body: { action: "close" },
      });

      expect(result.type).to.equal("redirect");
      expect(updateApplicationStatusStub.calledOnce).to.equal(true);
      expect(updateApplicationStatusStub.firstCall.args[0]).to.equal(uuid);
      expect(updateApplicationStatusStub.firstCall.args[1]).to.deep.equal({
        applicationState: "COMPLETED",
        eTag: 0,
      });
    });

    it("redirects to /confirmation page when submit is clicked", async () => {
      const result = await client.post(`/cases/${uuid}/task-list`, {
        session,
        body: { action: "submit" },
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal(`/cases/${uuid}/confirmation`);
    });
  });
});
