import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";

import { refreshAuthToken } from "#/auth/actions/refreshAuthToken.action.js";
import {
  NotAuthenticatedError,
  TokenRefreshError,
} from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

const SESSION_ID = "session-id";
const HOME_ACCOUNT_ID = "uid.tenant";

afterEach(() => {
  sinon.restore();
});

describe("refreshAuthToken", () => {
  it("returns NotAuthenticatedError when session id is missing", async () => {
    sinon.stub(logger, "warn");

    const result = await refreshAuthToken(HOME_ACCOUNT_ID, undefined);

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
  });

  it("returns NotAuthenticatedError when account reference is missing", async () => {
    sinon.stub(logger, "warn");

    const result = await refreshAuthToken(undefined, SESSION_ID);

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
  });

  it("returns a refreshed token when session context is valid", async () => {
    const acquireDownstreamAccessToken = sinon
      .stub()
      .resolves(success("new-access-token"));
    const createStub = sinon.stub(EntraService, "create").returns({
      acquireDownstreamAccessToken,
    } as unknown as EntraService);

    const result = await refreshAuthToken(
      ` ${HOME_ACCOUNT_ID} `,
      ` ${SESSION_ID} `,
    );

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be.true;
    expect(
      acquireDownstreamAccessToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(result).to.deep.equal(success("new-access-token"));
  });

  it("returns the token refresh error from EntraService", async () => {
    const tokenRefreshError = new TokenRefreshError();

    sinon.stub(EntraService, "create").returns({
      acquireDownstreamAccessToken: sinon
        .stub()
        .resolves(failure(tokenRefreshError)),
    } as unknown as EntraService);

    const result = await refreshAuthToken(HOME_ACCOUNT_ID, SESSION_ID);

    expect(result.error).to.equal(tokenRefreshError);
  });
});
