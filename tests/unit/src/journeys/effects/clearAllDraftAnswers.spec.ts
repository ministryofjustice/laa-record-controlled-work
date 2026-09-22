import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { clearAllDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

describe("ClearAllDraftAnswers", () => {
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let clearAnswer: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    getRequestParam = sinon.stub().returns(undefined);
    getAllAnswers = sinon.stub().returns({ ecf: "yes", means: "no" });
    clearAnswer = sinon.stub();

    context = {
      getSession,
      getRequestParam,
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

  it("clears the edit draft for the current application only", () => {
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-1");
    session.journeyDrafts = {
      "editClientDetails:application-1": { ecf: "yes" },
      "editClientDetails:application-2": { ecf: "no" },
    };

    clearAllDraftAnswers()(context, "editClientDetails");

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(drafts["editClientDetails:application-1"]).to.be.undefined;
    expect(drafts["editClientDetails:application-2"]).to.deep.equal({
      ecf: "no",
    });
  });
});
