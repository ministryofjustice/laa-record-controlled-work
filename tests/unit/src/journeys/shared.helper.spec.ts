import { type EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";
import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import type { JourneySession } from "#/journeys/context.type.js";

import { getSessionData } from "#/journeys/shared.helper.js";
import { InvalidSessionError } from "#/journeys/journey.errors.js";

type TestContext = EffectFunctionContext<
  Record<string, unknown>,
  Record<string, unknown>,
  JourneySession
>;

describe("getSessionData", () => {
  let getSession: sinon.SinonStub;
  let context: TestContext;

  afterEach(() => sinon.restore());

  it("returns the session when present", () => {
    const session = {
      journeyDrafts: {},
    };
    getSession = sinon.stub().returns(session);
    context = { getSession } as unknown as TestContext;

    expect(getSessionData(context)).to.equal(session);
  });

  it("throws InvalidSessionError when the session is missing", () => {
    getSession = sinon.stub().returns(undefined);
    context = { getSession } as unknown as TestContext;

    expect(() => getSessionData(context)).to.throw(InvalidSessionError);
  });

  it("throws InvalidSessionError when the session is not a journey session", () => {
    getSession = sinon.stub().returns("not-a-session");
    context = { getSession } as unknown as TestContext;

    expect(() => getSessionData(context)).to.throw(InvalidSessionError);
  });
});
