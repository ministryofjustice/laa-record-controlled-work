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
const HOME_ACCOUNT_ID = "uid.tenant";

afterEach(() => {
  sinon.restore();
});

describe("refreshToken", () => {
  it("passes through an undefined session id to EntraService.create", async () => {
    const tokenRefreshError = new TokenRefreshError();
    const serviceRefreshToken = sinon
      .stub()
      .resolves(failure(tokenRefreshError));
    const createStub = sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);

    const result = await refreshToken(
      HOME_ACCOUNT_ID,
      undefined as unknown as string,
    );

    expect(createStub.calledOnceWithExactly({ sessionId: undefined })).to.be.true;
    expect(
      serviceRefreshToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(result.error).to.equal(tokenRefreshError);
  });

  it("passes through an undefined account reference to EntraService.refreshToken", async () => {
    const tokenRefreshError = new TokenRefreshError();
    const serviceRefreshToken = sinon
      .stub()
      .resolves(failure(tokenRefreshError));
    const createStub = sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);

    const result = await refreshToken(
      undefined as unknown as string,
      SESSION_ID,
    );

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be.true;
    expect(
      serviceRefreshToken.calledOnceWithExactly(undefined, config.entra.scopes),
    ).to.be.true;
    expect(result.error).to.equal(tokenRefreshError);
  });

  it("returns a refreshed token when session context is valid", async () => {
    const refreshedAuthResult = {
      accessToken: "new-access-token",
    } as AuthenticationResult;
    const serviceRefreshToken = sinon
      .stub()
      .resolves(success(refreshedAuthResult));
    const createStub = sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);

    const result = await refreshToken(HOME_ACCOUNT_ID, SESSION_ID);

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be
      .true;
    expect(
      serviceRefreshToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(result).to.deep.equal(success(refreshedAuthResult));
  });

  it("returns the token refresh error from EntraService", async () => {
    const tokenRefreshError = new TokenRefreshError();
    const serviceRefreshToken = sinon
      .stub()
      .resolves(failure(tokenRefreshError));

    sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);

    const result = await refreshToken(HOME_ACCOUNT_ID, SESSION_ID);

    expect(
      serviceRefreshToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(result.error).to.equal(tokenRefreshError);
  });
});
