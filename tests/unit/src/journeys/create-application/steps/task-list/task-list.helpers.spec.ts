import { expect } from "chai";
import { describe, it } from "mocha";

import { taskItem } from "#/journeys/create-application/steps/task-list/task-list.helpers.js";
import { Status } from "#/journeys/journey.types.js";

describe("taskItem", () => {
  describe("Status.Completed", () => {
    it("returns the title text", () => {
      const item = taskItem("Client details", "check-answers", Status.Completed);
      expect(item.title.text).to.equal("Client details");
    });

    it("returns the href", () => {
      const item = taskItem("Client details", "check-answers", Status.Completed);
      expect(item.href).to.equal("check-answers");
    });

    it("returns the completed status text", () => {
      const item = taskItem("Client details", "check-answers", Status.Completed);
      expect(item.status.text).to.equal("Completed");
    });
  });

  describe("Status.Incomplete", () => {
    it("returns the title text", () => {
      const item = taskItem("Income and capital", "/income", Status.Incomplete);
      expect(item.title.text).to.equal("Income and capital");
    });

    it("returns the href", () => {
      const item = taskItem("Income and capital", "/income", Status.Incomplete);
      expect(item.href).to.equal("/income");
    });

    it("returns an incomplete status tag", () => {
      const item = taskItem("Income and capital", "/income", Status.Incomplete);
      const tag = item.status.tag as { text: string; classes: string };
      expect(tag.text).to.equal("Incomplete");
      expect(tag.classes).to.equal("govuk-tag--blue");
    });
  });

  describe("Status.CannotStart", () => {
    it("returns the title text", () => {
      const item = taskItem("Evidence", "/evidence", Status.CannotStart);
      expect(item.title.text).to.equal("Evidence");
    });

    it("does not return an href", () => {
      const item = taskItem("Evidence", "/evidence", Status.CannotStart);
      expect(item.href).to.be.undefined;
    });

    it("returns the cannot start yet status text and classes", () => {
      const item = taskItem("Evidence", "/evidence", Status.CannotStart);
      expect(item.status.text).to.equal("Cannot start yet");
      expect(item.status.classes).to.equal(
        "govuk-task-list__status--cannot-start-yet",
      );
    });
  });
});
