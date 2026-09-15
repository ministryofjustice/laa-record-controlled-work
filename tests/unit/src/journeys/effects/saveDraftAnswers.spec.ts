import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { saveDraftAnswers } from "#/journeys/effects/saveDraftAnswers.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";

describe("saveDraftAnswers()", () => {
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = { cookie: {}, id: "session-id", save: sinon.stub() };
    getSession = sinon.stub().returns(session);
    getRequestParam = sinon.stub().returns(undefined);
    getAllAnswers = sinon.stub().returns({ ecf: "yes" });

    context = {
      getSession,
      getRequestParam,
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

  it("saves the edit draft for the current application", () => {
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-1");

    saveDraftAnswers()(context, "editClientDetails");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts?.["editClientDetails:application-1"]?.ecf).to.equal("yes");
  });
});