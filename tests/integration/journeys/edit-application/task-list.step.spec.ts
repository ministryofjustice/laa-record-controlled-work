import {
  TestRenderResult,
  TestRedirectResult,
} from "@ministryofjustice/hmpps-forge/core/testing";
import { expect } from "chai";
import { createForgeTestClient } from "../../utils/helpers.js";
import { RenderBlock } from "@ministryofjustice/hmpps-forge/core/framework";
import { taskListStep } from "#/journeys/edit-application/steps/task-list/task-list.step.js";

describe("Task list step", () => {
  const client = createForgeTestClient(
    "Edit case",
    "/cases/CW-123456/",
    taskListStep(),
  );
  const session = {
    journeyDrafts: {
      testJourney: {},
    },
  };

  describe("GET /cases/CW-123456/task-list", () => {
    let renderResult: TestRenderResult;
    let heading: RenderBlock;
    let body: RenderBlock;
    let taskLists: RenderBlock[];
    let submitButton: RenderBlock;

    before(async () => {
      const result = await client.get("/cases/CW-123456/task-list", {
        session,
      });
      expect(result.type).to.equal("render");
      renderResult = result as TestRenderResult;
      [heading, body] = renderResult.getBlocksByVariant("html");
      taskLists = renderResult.getBlocksByVariant("govukTaskList");
      [submitButton] = renderResult.getBlocksByVariant("govukButton");
    });

    it("renders the client name as the heading", () => {
      expect(heading.properties.content).to.equal("Joe Blogs");
    });

    it("renders the reference number", () => {
      expect(body.properties.content).to.equal("Reference number: CW-123456");
    });

    it("renders 3 task list sections", () => {
      expect(taskLists.length).to.equal(3);
    });

    it("renders the client details task as completed", () => {
      const items = taskLists[0].properties.items as Array<{
        title: { text: string };
        href?: string;
        status: { text?: string };
      }>;
      expect(items.length).to.equal(1);
      expect(items[0].title.text).to.equal("Client details");
      expect(items[0].href).to.equal("/cases/new/check-answers");
      expect(items[0].status.text).to.equal("Completed");
    });

    it("renders the means assessment task as incomplete", () => {
      const items = taskLists[1].properties.items as Array<{
        title: { text: string };
        href?: string;
        status: { tag: { text: string } };
      }>;
      expect(items.length).to.equal(1);
      expect(items[0].title.text).to.equal("Income and capital");
      expect(items[0].href).to.equal("/cases/CW-123456/eligibility/");
      expect(items[0].status.tag.text).to.equal("Incomplete");
    });

    it("renders the evidence task as incomplete and declaration task as cannot start yet", () => {
      const items = taskLists[2].properties.items as Array<{
        title: { text: string };
        href?: string;
        status: { tag: { text?: string }; text?: string };
      }>;
      expect(items.length).to.equal(2);
      expect(items[0].title.text).to.equal("Evidence");
      expect(items[0].status.tag.text).to.equal("Incomplete");
      expect(items[0].href).to.equal("/cases/evidence/have-evidence");
      expect(items[1].title.text).to.equal("Client declaration");
      expect(items[1].status.text).to.equal("Cannot start yet");
    });

    it("renders the save and return button", () => {
      expect(submitButton.properties.text).to.equal("Save and return later");
    });
  });

  describe("POST /cases/CW-123456/task-list", () => {
    it("redirects to the case list", async () => {
      const result = await client.post("/cases/CW-123456/task-list", {
        session,
      });
      expect(result.type).to.equal("redirect");
      const redirectResult = result as TestRedirectResult;
      expect(redirectResult.url).to.equal("/case-list");
    });
  });
});

