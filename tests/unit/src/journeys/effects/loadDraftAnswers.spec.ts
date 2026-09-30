import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { loadDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

describe("LoadDraftAnswers", () => {
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let hasAnswer: sinon.SinonStub;
  let setAnswer: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    getRequestParam = sinon.stub().returns(undefined);
    hasAnswer = sinon.stub().returns(false);
    setAnswer = sinon.stub();

    context = {
      getSession,
      getRequestParam,
      hasAnswer,
      setAnswer,
    } as unknown as EffectFunctionContext;
  });

  afterEach(() => sinon.restore());

  it("loads draft answers from the session into the context", () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };

    loadDraftAnswers()(context, "testJourney");

    expect(setAnswer.calledOnce).to.equal(true);
    expect(setAnswer.firstCall.args[0]).to.equal("ecf");
    expect(setAnswer.firstCall.args[1]).to.equal("yes");
  });

  it("does nothing when no draft exists for this journey", () => {
    session.journeyDrafts = {
      testJourney: {},
    };

    loadDraftAnswers()(context, "testJourney");

    expect(setAnswer.called).to.equal(false);
  });

  it("does not overwrite existing answers already in context", () => {
    session.journeyDrafts = {
      testJourney: { ecf: "yes" },
    };
    hasAnswer.withArgs("ecf").returns(true);

    loadDraftAnswers()(context, "testJourney");

    expect(setAnswer.called).to.equal(false);
  });

  it("loads the edit draft for the current application", () => {
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-1");
    session.journeyDrafts = {
      "editClientDetails:application-1": { ecf: "yes" },
      "editClientDetails:application-2": { ecf: "no" },
    };

    loadDraftAnswers()(context, "editClientDetails");

    expect(setAnswer.calledOnceWithExactly("ecf", "yes")).to.equal(true);
  });

  it("loads only the current application's evidence draft", () => {
    getRequestParam.onCall(0).returns("application-1");
    getRequestParam.onCall(1).returns("application-2");
    session.journeyDrafts = {
      "evidence:application-1": { ecf: "yes" },
      "evidence:application-2": { ecf: "no" },
    };

    loadDraftAnswers()(context, "evidence");
    loadDraftAnswers()(context, "evidence");

    expect(setAnswer.firstCall.args).to.deep.equal(["ecf", "yes"]);
    expect(setAnswer.secondCall.args).to.deep.equal(["ecf", "no"]);
  });

  it("does not load an unscoped evidence draft for an application", () => {
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-1");
    session.journeyDrafts = {
      evidence: { ecf: "legacy" },
    };

    loadDraftAnswers()(context, "evidence");

    expect(setAnswer.called).to.equal(false);
  });
});
