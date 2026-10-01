import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { loadApplicationAsAnswers } from "#/journeys/edit-client-details/effects/loadApplicationAsAnswers.js";
import { CONTEXT_DATA_KEYS, PARAMS_KEYS } from "#/journeys/journey.constants.js";

describe("loadApplicationAsAnswers", () => {
  const journeyCode = "editClientDetails";
  const application = {} as Application;
  const answers = {
    firstName: "Jane",
    hasNINumber: "no",
  } as ReturnType<typeof ApplicationDto.toAnswers>;

  let context: EditApplicationContext;
  let getData: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let setAnswer: sinon.SinonStub;
  let toAnswers: sinon.SinonStub;

  beforeEach(() => {
    getData = sinon
      .stub()
      .withArgs(CONTEXT_DATA_KEYS.application)
      .returns(application);
    getRequestParam = sinon
      .stub()
      .withArgs(PARAMS_KEYS.applicationID)
      .returns("application-1");
    getSession = sinon.stub();
    getAllAnswers = sinon.stub().returns(answers);
    setAnswer = sinon.stub();

    context = {
      getData,
      getRequestParam,
      getSession,
      getAllAnswers,
      setAnswer,
    } as unknown as EditApplicationContext;

    toAnswers = sinon.stub(ApplicationDto, "toAnswers").returns(answers);
  });

  afterEach(() => sinon.restore());

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
      [`${journeyCode}:application-1`]: { ...answers },
    });
  });

  it("does not overwrite an existing journey draft", () => {
    const session = {
      journeyDrafts: {
        [`${journeyCode}:application-1`]: { existingAnswer: "keep" },
        anotherJourney: { otherAnswer: "keep" },
      },
    };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(getData.called).to.equal(false);
    expect(toAnswers.called).to.equal(false);
    expect(setAnswer.called).to.equal(false);
    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: { existingAnswer: "keep" },
      anotherJourney: { otherAnswer: "keep" },
    });
  });

  it("initializes journey drafts when none exist", () => {
    const session: { journeyDrafts?: Record<string, unknown> } = {};
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: answers,
    });
  });

  it("keeps drafts separate for different applications", () => {
    const session = { journeyDrafts: {} };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-2");

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: answers,
      [`${journeyCode}:application-2`]: answers,
    });
  });
});
