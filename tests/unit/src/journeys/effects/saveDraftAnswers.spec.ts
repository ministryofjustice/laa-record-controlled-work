import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { saveDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

describe("saveDraftAnswers()", () => {
  let getSession: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    getAllAnswers = sinon.stub().returns({ ecf: "yes" });

    context = {
      getSession,
      getAllAnswers,
    } as unknown as EffectFunctionContext;
  });

  afterEach(() => sinon.restore());

  it("persists draft answers in the session under the journey key", () => {
    saveDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });

  it("preserves draft answers from other journeys", () => {
    session.journeyDrafts = {
      anotherJourney: { someAnswer: "yes" },
    };

    saveDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts?.testJourney?.ecf).to.equal("yes");
    expect(drafts?.anotherJourney?.someAnswer).to.equal("yes");
  });

  it("merges with existing draft answers for the same journey", () => {
    session.journeyDrafts = {
      testJourney: { existingAnswer: "foo" },
    };

    saveDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts?.testJourney?.existingAnswer).to.equal("foo");
    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });

  it("overwrites existing draft answer for the same question", () => {
    session.journeyDrafts = {
      testJourney: { ecf: "no" },
    };

    saveDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts?.testJourney?.ecf).to.equal("yes");
  });
});