import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { clearAllDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

describe("ClearAllDraftAnswers", () => {
  let getSession: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let clearAnswer: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    getAllAnswers = sinon.stub().returns({ ecf: "yes", means: "no" });
    clearAnswer = sinon.stub();

    context = {
      getSession,
      getAllAnswers,
      clearAnswer,
    } as unknown as EffectFunctionContext;
  });

  afterEach(() => sinon.restore());

  it("removes the journey's draft from the session", () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };

    clearAllDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.testJourney).to.be.undefined;
    expect(clearAnswer.calledTwice).to.equal(true);
    expect(clearAnswer.firstCall.args[0]).to.equal("ecf");
    expect(clearAnswer.secondCall.args[0]).to.equal("means");
  });

  it("preserves drafts for other journeys", () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
      anotherJourney: { someAnswer: "yes" },
    };

    clearAllDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(
      (drafts.anotherJourney as Record<string, unknown>).someAnswer,
    ).to.equal("yes");
  });

  it("does nothing when no draft exists for the journey", () => {
    session.journeyDrafts = { anotherJourney: { someAnswer: "yes" } };

    clearAllDraftAnswers()(context, "testJourney");

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts.anotherJourney).to.exist;
  });
});
