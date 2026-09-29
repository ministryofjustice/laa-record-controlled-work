import type { AuthenticationResult } from "@azure/msal-node";

import { expect } from "chai";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";

import { refreshToken } from "#/auth/actions/refreshToken.action.js";
import { TokenRefreshError } from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { failure, success } from "#/lib/either.js";

const SESSION_ID = "session-id";
const HOME_ACCOUNT_ID = "test@example.com";

afterEach(() => {
  sinon.restore();
});

describe("refreshToken", () => {
  it("returns a refreshed token when session context is valid", async () => {
    const refreshTokenMockResult = {
      accessToken: "new-access-token",
    } as AuthenticationResult;

    const refreshTokenMock = sinon
      .stub()
      .resolves(success(refreshTokenMockResult));

    const createMock = sinon.stub(EntraService, "create").returns({
      refreshToken: refreshTokenMock,
    } as unknown as EntraService);

    const result = await refreshToken(HOME_ACCOUNT_ID, SESSION_ID);

    expect(createMock.calledOnce).to.be.true;
    expect(createMock.calledWith({ sessionId: SESSION_ID })).to.be.true;

    const refreshTokenArgs = [HOME_ACCOUNT_ID, config.entra.scopes];
    expect(refreshTokenMock.calledOnce).to.be.true;
    expect(refreshTokenMock.calledWith(...refreshTokenArgs)).to.be.true;
    expect(result).to.deep.equal(success(refreshTokenMockResult));
  });

  it("returns a TokenRefreshError on failure", async () => {
    const tokenRefreshError = new TokenRefreshError();
    const refreshTokenMock = sinon.stub().resolves(failure(tokenRefreshError));

    sinon.stub(EntraService, "create").returns({
      refreshToken: refreshTokenMock,
    } as unknown as EntraService);

    const result = await refreshToken(HOME_ACCOUNT_ID, SESSION_ID);

    const refreshTokenArgs = [HOME_ACCOUNT_ID, config.entra.scopes];
    expect(refreshTokenMock.calledOnce).to.be.true;
    expect(refreshTokenMock.calledWith(...refreshTokenArgs)).to.be.true;
    expect(result.error).to.equal(tokenRefreshError);
  });
});
