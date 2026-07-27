import { expect } from "chai";
import sinon from "sinon";

import {
  type RcwApiAuthContext,
  RCW_API_AUTH_CONTEXT_STATE_KEY,
} from "#/api/rcw-api-auth-context.js";
import { RcwApiClient } from "#/api/rcw-api.client.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";

const mockApiResponse = { data: [], status: 200 };

describe("createRcwApiClient", () => {
  const requestAuthContext: RcwApiAuthContext = {
    getBearerToken: async () => "test-user-access-token",
  };
  const requestStateContext = {
    getState: (key: string): unknown =>
      key === RCW_API_AUTH_CONTEXT_STATE_KEY ? requestAuthContext : undefined,
  };

  it("throws NotAuthenticatedError when request state has no auth context", async () => {
    const getApplications = sinon.stub().resolves(mockApiResponse);
    const client = RcwApiClient.create({
      operations: { getApplications },
    });

    let error: unknown;
    try {
      await client.getApplications({
        getState: () => undefined,
      });
    } catch (caughtError) {
      error = caughtError;
    }

    expect(error).to.be.instanceOf(NotAuthenticatedError);
    expect(getApplications.called).to.be.false;
  });

  it("adds bearer Authorization header from auth context", async () => {
    const getApplications = sinon.stub().resolves(mockApiResponse);
    const client = RcwApiClient.create({
      operations: { getApplications },
    });

    await client.getApplications(requestStateContext);

    expect(getApplications.calledOnce).to.be.true;
    const [options] = getApplications.firstCall.args as [RequestInit];
    expect(new Headers(options.headers).get("authorization")).to.equal(
      "Bearer test-user-access-token",
    );
  });

  it("keeps caller-supplied Authorization header precedence", async () => {
    const getApplications = sinon.stub().resolves(mockApiResponse);
    const client = RcwApiClient.create({
      operations: { getApplications },
    });

    await client.getApplications(
      {
        getState: (key: string): unknown =>
          key === RCW_API_AUTH_CONTEXT_STATE_KEY
            ? { getBearerToken: async () => "context-access-token" }
            : undefined,
      },
      {
        headers: {
          Authorization: "Bearer explicit-token",
          "x-custom": "value",
        },
      },
    );

    const [options] = getApplications.firstCall.args as [RequestInit];
    const headers = new Headers(options.headers);
    expect(headers.get("authorization")).to.equal("Bearer explicit-token");
    expect(headers.get("x-custom")).to.equal("value");
  });
});
