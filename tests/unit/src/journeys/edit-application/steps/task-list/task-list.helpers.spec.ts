import { expect } from "chai";
import { describe, it } from "mocha";

import { taskItem } from "#/journeys/edit-application/steps/task-list/task-list.helpers.js";
import { Status } from "#/journeys/journey.types.js";

describe("taskItem", () => {
  it("Status.Completed returns correct text, href and status", () => {
    const item = taskItem("Client details", "check-answers", Status.Completed);

    expect(item.title.text).to.equal("Client details");
    expect(item.href).to.equal("check-answers");
    expect(item.status.text).to.equal("Completed");
  });

  it("Status.Incomplete returns correct text, href and status ", () => {
    const item = taskItem("Income and capital", "/income", Status.Incomplete);
    const tag = item.status.tag as { text: string; classes: string };

    expect(item.title.text).to.equal("Income and capital");
    expect(item.href).to.equal("/income");
    expect(tag.text).to.equal("Incomplete");
    expect(tag.classes).to.equal("govuk-tag--blue");
  });

  it("Status.CannotStart returns correct text and status without href", () => {
    const item = taskItem("Evidence", "/evidence", Status.CannotStart);

    expect(item.title.text).to.equal("Evidence");
    expect(item.href).to.be.undefined;
    expect(item.status.text).to.equal("Cannot start yet");
    expect(item.status.classes).to.equal(
      "govuk-task-list__status--cannot-start-yet",
    );
  });
});
