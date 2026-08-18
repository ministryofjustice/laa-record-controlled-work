import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";
import { clearFieldAnswers } from "#/journeys/effects.js";
import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core/authoring";

describe("ClearFieldAnswers", () => {
  let getSession: sinon.SinonStub;
  let clearAnswer: sinon.SinonStub;
  let context: EffectFunctionContext;
  let session: Record<string, unknown>;

  beforeEach(() => {
    session = {};
    getSession = sinon.stub().returns(session);
    clearAnswer = sinon.stub();

    context = {
      getSession,
      clearAnswer,
    } as unknown as EffectFunctionContext;
  });

  afterEach(() => sinon.restore());

  it("removes specific field answers from the journey's draft and retains other fields", () => {
    session.journeyDrafts = {
      testJourney: {
        addressLine1: "addressLine1",
        addressLine2: "addressLine2",
        addressLine3: "addressLine3",
      },
    };

    clearFieldAnswers()(context, "testJourney", ["addressLine2", "addressLine3"]);

    const drafts = session.journeyDrafts as Record<string, unknown>;
    expect(
      (drafts.testJourney as Record<string, unknown>).addressLine1,
    ).to.equal("addressLine1");
    expect(
      (drafts.testJourney as Record<string, unknown>).addressLine2,
    ).to.be.undefined;
    expect(
      (drafts.testJourney as Record<string, unknown>).addressLine3,
    ).to.be.undefined;
    expect(clearAnswer.calledTwice).to.equal(true);
    expect(clearAnswer.firstCall.args[0]).to.equal("addressLine2");
    expect(clearAnswer.secondCall.args[0]).to.equal("addressLine3");
  });

  it("preserves drafts for other journeys", () => {
    session.journeyDrafts = {
      testJourney: {
        addressLine1: "addressLine1",
        addressLine2: "addressLine2",
      },
      anotherJourney: { someAnswer: "yes" },
    };

    clearFieldAnswers()(context, "testJourney", ["addressLine2"]);

    const drafts = session.journeyDrafts as Record<string, Record<string, unknown>>;
    expect(drafts.anotherJourney.someAnswer).to.equal("yes");
  });

  it("clears answers in context even when no draft exists for the journey", () => {
    session.journeyDrafts = { anotherJourney: { someAnswer: "yes" } };

    clearFieldAnswers()(context, "testJourney", ["addressLine2", "addressLine3"]);

    expect(clearAnswer.calledTwice).to.equal(true);
  });
});
