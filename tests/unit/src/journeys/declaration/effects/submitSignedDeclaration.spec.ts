import { submitSignedDeclaration } from "#/journeys/declaration/effects/submitSignedDeclaration.js";
import sinon from "sinon";
import { DeclarationContext } from "#/journeys/declaration/declaration.types.js";
import { expect } from "chai";
import { faker } from "@faker-js/faker";
import { logger } from "#/logger.js";
import { ApiResponseError } from "#/api/clients/api.errors.js";
import {
  UndefinedAnswerError,
  UndefinedParamError,
  UndefinedSessionError,
} from "#/journeys/errors.js";

describe("submitSignedDeclaration", () => {
  const applicationId = faker.string.uuid();
  const date = faker.date.past().toISOString().split("T")[0];

  const createDeps = (responseHttpStatus: number) => {
    const mock = sinon.stub().returns({
      status: responseHttpStatus,
    });
    const deps = {
      updateApplicationDeclaration: mock,
    };
    return { deps, mock };
  };

  const createContext = (
    confirmed: string[] | undefined,
    signedDate: string | undefined,
  ) => {
    return {
      getAnswer: sinon.stub().callsFake((key: string) => {
        switch (key) {
          case "declarationSignedConfirm":
            return confirmed;
          case "declarationSignedDate":
            return signedDate;
          default:
            return undefined;
        }
      }),
      getRequestParam: sinon.stub().returns(applicationId),
      getSession: sinon.stub().returns({}),
      setData: sinon.stub(),
    } as unknown as DeclarationContext;
  };

  it("calls updateApplicationDeclaration() when all expected data is available", async () => {
    const { deps, mock } = createDeps(204);
    const context = createContext(["yes"], date);
    await submitSignedDeclaration(deps)(context);

    expect(mock.called).to.be.equal(true);
    expect(
      mock.calledWith(applicationId, {
        dateSigned: date,
        declarationConfirmation: true,
      }),
    ).to.be.equal(true);
  });

  it("throws when the session is missing", async () => {
    const { deps } = createDeps(204);
    const context = createContext(["yes"], date);
    context.getSession = sinon.stub().returns(undefined);

    try {
      await submitSignedDeclaration(deps)(context);
      expect.fail("Expected submitSignedDeclaration to reject");
    } catch (error) {
      expect(error).to.be.instanceOf(UndefinedSessionError);
    }
  });

  it("throws when the applicationId is missing", async () => {
    const { deps } = createDeps(204);
    const context = createContext(["yes"], date);
    context.getRequestParam = sinon.stub().returns(undefined);

    try {
      await submitSignedDeclaration(deps)(context);
      expect.fail("Expected submitSignedDeclaration to reject");
    } catch (error) {
      expect(error).to.be.instanceOf(UndefinedParamError);
    }
  });

  it("throws when the declaration confirmation answer is missing", async () => {
    const { deps } = createDeps(204);
    const context = createContext(undefined, date);

    try {
      await submitSignedDeclaration(deps)(context);
      expect.fail("Expected submitSignedDeclaration to reject");
    } catch (error) {
      expect(error).to.be.instanceOf(UndefinedAnswerError);
    }
  });

  it("throws when the declaration signed date answer is missing", async () => {
    const { deps } = createDeps(204);
    const context = createContext(["yes"], undefined);

    try {
      await submitSignedDeclaration(deps)(context);
      expect.fail("Expected submitSignedDeclaration to reject");
    } catch (error) {
      expect(error).to.be.instanceOf(UndefinedAnswerError);
    }
  });

  it("throws when the API call fails", async () => {
    const { deps, mock } = createDeps(204);
    const context = createContext(["yes"], date);

    mock.throws(new Error("API call failed"));

    try {
      await submitSignedDeclaration(deps)(context);
      expect.fail("Expected submitSignedDeclaration to reject");
    } catch (error) {
      expect(error).to.be.instanceOf(ApiResponseError);
    }
  });

  [200, 400].forEach((status) => {
    it(`throws when the API response is not 204 (${status})`, async () => {
      const { deps } = createDeps(status);
      const context = createContext(["yes"], date);

      try {
        await submitSignedDeclaration(deps)(context);
        expect.fail("Expected submitSignedDeclaration to reject");
      } catch (error) {
        expect(error).to.be.instanceOf(ApiResponseError);
      }
    });
  });
});
