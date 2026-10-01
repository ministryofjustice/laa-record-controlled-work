import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { saveDraftAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";
import { PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { JourneyCode } from "#/journeys/JourneyCode.enum.js";

describe("saveDraftAnswers()", () => {
  let getSession: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
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

  it("saves evidence drafts independently for each application", () => {
    getRequestParam.returns("application-1");
    getAllAnswers.returns({ ecf: "yes" });

    saveDraftAnswers()(context, "evidence");

    getRequestParam.returns("application-2");
    getAllAnswers.returns({ ecf: "no" });
    saveDraftAnswers()(context, "evidence");

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts["evidence:application-1"]).to.deep.equal({ ecf: "yes" });
    expect(drafts["evidence:application-2"]).to.deep.equal({ ecf: "no" });
  });

  it("keeps the create-application journey key without an application ID", () => {
    saveDraftAnswers()(context, JourneyCode.CREATE_APPLICATION);

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts[JourneyCode.CREATE_APPLICATION]).to.deep.equal({ ecf: "yes" });
  });
});
