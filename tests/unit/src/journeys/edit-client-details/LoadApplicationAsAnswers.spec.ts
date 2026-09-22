import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { loadApplicationAsAnswers } from "#/journeys/edit-client-details/effects/loadApplicationAsAnswers.js";
import { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

describe("loadApplicationAsAnswers", () => {
  const journeyCode = "editClientDetails";
  const application = {} as Application;
  const answers = {
    firstName: "Jane",
    hasNINumber: "no",
  } as ReturnType<typeof ApplicationDto.toAnswers>;

  let context: EditApplicationContext;
  let getData: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let setAnswer: sinon.SinonStub;
  let toAnswers: sinon.SinonStub;

  beforeEach(() => {
    getData = sinon
      .stub()
      .withArgs(CONTEXT_DATA_KEYS.application)
      .returns(application);
    getSession = sinon.stub();
    getAllAnswers = sinon.stub().returns(answers);
    setAnswer = sinon.stub();

    context = {
      getData,
      getSession,
      getAllAnswers,
      setAnswer,
    } as unknown as EditApplicationContext;

    toAnswers = sinon.stub(ApplicationDto, "toAnswers").returns(answers);
  });

  afterEach(() => sinon.restore());

  it("does nothing when there is no journey session", () => {
    getSession.returns(undefined);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(getData.called).to.equal(false);
    expect(setAnswer.called).to.equal(false);
    expect(getAllAnswers.called).to.equal(false);
  });

  it("loads application answers", () => {
    const session = {
      journeyDrafts: {},
    };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(
      getData.calledOnceWithExactly(CONTEXT_DATA_KEYS.application),
    ).to.equal(true);
    expect(toAnswers.calledOnceWithExactly(application)).to.equal(true);
    expect(setAnswer.calledWithExactly("firstName", "Jane")).to.equal(true);
    expect(setAnswer.calledWithExactly("hasNINumber", "no")).to.equal(true);
    expect(session.journeyDrafts).to.deep.equal({
      [journeyCode]: { ...answers },
    });
  });

  it("loads application answers and retains existing journey data", () => {
    const session = {
      journeyDrafts: {
        [journeyCode]: { existingAnswer: "keep" },
        anotherJourney: { otherAnswer: "keep" },
      },
    };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(
      getData.calledOnceWithExactly(CONTEXT_DATA_KEYS.application),
    ).to.equal(true);
    expect(toAnswers.calledOnceWithExactly(application)).to.equal(true);
    expect(setAnswer.calledWithExactly("firstName", "Jane")).to.equal(true);
    expect(setAnswer.calledWithExactly("hasNINumber", "no")).to.equal(true);
    expect(session.journeyDrafts).to.deep.equal({
      [journeyCode]: { existingAnswer: "keep", ...answers },
      anotherJourney: { otherAnswer: "keep" },
    });
  });

  it("initializes journey drafts when none exist", () => {
    const session: { journeyDrafts?: Record<string, unknown> } = {};
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [journeyCode]: answers,
    });
  });
});
