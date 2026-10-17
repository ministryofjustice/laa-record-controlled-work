import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { EditApplicationContext } from "#/journeys/edit-application/editApplication.types.js";

import { ApplicationDto } from "#/api/dto/application/application.dto.js";
import { loadApplicationAsAnswers } from "#/journeys/edit-client-details/effects/loadApplicationAsAnswers.js";
import { CONTEXT_DATA_KEYS, PARAMS_KEYS } from "#/journeys/journey.constants.js";
import { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

describe("loadApplicationAsAnswers", () => {
  const journeyCode = "editClientDetails";
  const application = {} as Application;
  const answers = {
    familyLawClassification: "public",
    careProceedingsStarted: "yes",
    careProceedingsParentalResponsibility: "no",
    firstName: "Jane",
    hasNINumber: "no",
  } as Partial<AnswersOutput>;

  let context: EditApplicationContext;
  let getData: sinon.SinonStub;
  let getRequestParam: sinon.SinonStub;
  let getSession: sinon.SinonStub;
  let getAllAnswers: sinon.SinonStub;
  let setAnswer: sinon.SinonStub;
  let toAnswers: sinon.SinonStub;

  beforeEach(() => {
    getData = sinon.stub();
    getData.withArgs(CONTEXT_DATA_KEYS.application).returns(application);
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
    getData
      .withArgs(CONTEXT_DATA_KEYS.applicationETag)
      .returns('"00023"');
    const session = {
      journeyDrafts: {},
      journeyDraftVersions: {},
    };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(
      getData.calledWithExactly(CONTEXT_DATA_KEYS.application),
    ).to.equal(true);
    expect(
      getData.calledWithExactly(CONTEXT_DATA_KEYS.applicationETag),
    ).to.equal(true);
    expect(toAnswers.calledOnceWithExactly(application)).to.equal(true);
    expect(setAnswer.calledWithExactly("firstName", "Jane")).to.equal(true);
    expect(setAnswer.calledWithExactly("hasNINumber", "no")).to.equal(true);
    expect(
      setAnswer.calledWithExactly("familyLawClassification", "public"),
    ).to.equal(true);
    expect(
      setAnswer.calledWithExactly("careProceedingsStarted", "yes"),
    ).to.equal(true);
    expect(
      setAnswer.calledWithExactly("careProceedingsParentalResponsibility", "no"),
    ).to.equal(true);
    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: { ...answers },
    });
    expect(session.journeyDraftVersions).to.deep.equal({
      [`${journeyCode}:application-1`]: '"00023"',
    });
  });

  it("does not overwrite an existing journey draft", () => {
    const session = {
      journeyDrafts: {
        [`${journeyCode}:application-1`]: { existingAnswer: "keep" },
        anotherJourney: { otherAnswer: "keep" },
      },
      journeyDraftVersions: { anotherJourney: '"31"' },
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
    expect(session.journeyDraftVersions).to.deep.equal({
      anotherJourney: '"31"',
    });
  });

  it("initializes journey drafts when none exist", () => {
    getData
      .withArgs(CONTEXT_DATA_KEYS.applicationETag)
      .returns('"9007199254740992"');
    const session: {
      journeyDrafts?: Record<string, unknown>;
      journeyDraftVersions?: Record<string, string>;
    } = {};
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: answers,
    });
    expect(session.journeyDraftVersions).to.deep.equal({
      [`${journeyCode}:application-1`]: '"9007199254740992"',
    });
  });

  it("does not attach a later ETag to a draft created without one", () => {
    const session = {
      journeyDrafts: {},
      journeyDraftVersions: { [`${journeyCode}:application-1`]: '"old"' },
    };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);
    getData
      .withArgs(CONTEXT_DATA_KEYS.applicationETag)
      .returns('"42"');

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: answers,
    });
    expect(session.journeyDraftVersions[`${journeyCode}:application-1`]).to.be
      .undefined;
  });

  it("keeps drafts separate for different applications", () => {
    getData
      .withArgs(CONTEXT_DATA_KEYS.applicationETag)
      .onFirstCall()
      .returns('"00023"');
    getData
      .withArgs(CONTEXT_DATA_KEYS.applicationETag)
      .onSecondCall()
      .returns('"9007199254740992"');
    const session = { journeyDrafts: {}, journeyDraftVersions: {} };
    getSession.returns(session);

    loadApplicationAsAnswers()(context, journeyCode);
    getRequestParam.withArgs(PARAMS_KEYS.applicationID).returns("application-2");

    loadApplicationAsAnswers()(context, journeyCode);

    expect(session.journeyDrafts).to.deep.equal({
      [`${journeyCode}:application-1`]: answers,
      [`${journeyCode}:application-2`]: answers,
    });
    expect(session.journeyDraftVersions).to.deep.equal({
      [`${journeyCode}:application-1`]: '"00023"',
      [`${journeyCode}:application-2`]: '"9007199254740992"',
    });
  });
});
