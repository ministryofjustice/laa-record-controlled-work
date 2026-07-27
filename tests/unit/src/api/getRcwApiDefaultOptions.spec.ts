import type { AccountInfo } from "@azure/msal-node";

import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import sinon from "sinon";

import {
  type GetRcwApiDefaultOptionsParams,
  getRcwApiDefaultOptions,
} from "#/api/getRcwApiDefaultOptions.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { logger } from "#/logger.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

function createParams(session: unknown): GetRcwApiDefaultOptionsParams {
  return {
    session: session as GetRcwApiDefaultOptionsParams["session"],
  };
}

afterEach(() => {
  sinon.restore();

  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
    return;
  }

  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("getRcwApiDefaultOptions", () => {
  it("returns a bearer Authorization header in test environment", async () => {
    process.env.NODE_ENV = "test";

    const options = await getRcwApiDefaultOptions(createParams(undefined));

    expect(options.headers).to.deep.equal({
      Authorization: "Bearer test-access-token",
    });
  });

  it("throws NotAuthenticatedError when session account is missing outside test environment", async () => {
    process.env.NODE_ENV = "development";
    sinon.stub(logger, "error");

    const params = createParams({ id: "session-id" });

    let error: unknown;
    try {
      await getRcwApiDefaultOptions(params);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(NotAuthenticatedError);
  });

  it("throws NotAuthenticatedError when session id is missing outside test environment", async () => {
    process.env.NODE_ENV = "development";
    sinon.stub(logger, "error");

    const params = createParams({
      account: { username: "caseworker" } as AccountInfo,
    });

    let error: unknown;
    try {
      await getRcwApiDefaultOptions(params);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(NotAuthenticatedError);
  });
});
