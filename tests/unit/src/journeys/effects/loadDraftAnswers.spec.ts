import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { loadDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

describe("LoadDraftAnswers", () => {
  let getSession: sinon.SinonStub;
  let hasAnswer: sinon.SinonStub;
  let setAnswer: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    hasAnswer = sinon.stub().returns(false);
    setAnswer = sinon.stub();

    context = {
      getSession,
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
});