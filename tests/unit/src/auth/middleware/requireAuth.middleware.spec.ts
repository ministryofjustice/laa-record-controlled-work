import type { AuthenticationResult } from "@azure/msal-node";

import { expect } from "chai";
import type { Request, Response } from "express";
import { afterEach, describe, it } from "mocha";
import sinon from "sinon";

import { TokenRefreshError } from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import { requireAuth } from "#/auth/middleware/requireAuth.middleware.js";
import config from "#/config.js";
import type { Office } from "#/journeys/select-office/select-office.types.js";
import { failure, success } from "#/lib/either.js";

const SESSION_ID = "session-id";
const HOME_ACCOUNT_ID = "uid.tenant";

afterEach(() => {
  sinon.restore();
});

describe("requireAuth", () => {
  describe("ignored paths", () => {
    const ignoredAuthPaths = [
      "/auth/signin",
      "/auth/signout",
      "/auth/callback",
      "/auth/refresh",
    ];

    for (const path of ignoredAuthPaths) {
      it(`bypasses auth checks for unauthenticated requests to ${path}`, async () => {
        const { req, res, next, redirect } = createMocks({
          account: undefined,
          originalUrl: path,
          url: path,
        });

        await requireAuth()(req, res, next);

        expect(next.calledOnceWithExactly()).to.be.true;
        expect(redirect.called).to.be.false;
      });
    }

    it("bypasses auth checks for unauthenticated requests to /select-office", async () => {
      const { req, res, next, redirect } = createMocks({
        account: undefined,
        originalUrl: "/select-office",
        url: "/select-office",
      });

      await requireAuth()(req, res, next);

      expect(next.calledOnceWithExactly()).to.be.true;
      expect(redirect.called).to.be.false;
    });
  });

  it("redirects to /auth/signin when auth token is missing", async () => {
    const { req, res, next, redirect, session } = createMocks({ account: undefined });

    await requireAuth()(req, res, next);

    expect(redirect.calledOnceWithExactly("/auth/signin")).to.be.true;
    expect(next.called).to.be.false;
    expect(session.account).to.equal(undefined);
  });

  it("refreshes expired auth and continues when refresh succeeds", async () => {
    const refreshedAccount = createAccount({
      exp: getNowInSeconds() + 600,
      offices: ["OFFICE-1"],
    });
    const refreshedAuthResult = {
      accessToken: "new-access-token",
      account: refreshedAccount,
    } as AuthenticationResult;
    const serviceRefreshToken = sinon
      .stub()
      .resolves(success(refreshedAuthResult));
    const createStub = sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);
    const { req, res, next, redirect, session } = createMocks({
      account: createAccount({ exp: getNowInSeconds() - 10 }),
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be.true;
    expect(
      serviceRefreshToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(session.account).to.equal(refreshedAccount);
    expect(redirect.called).to.be.false;
    expect(next.calledOnceWithExactly()).to.be.true;
  });

  it("redirects to /auth/signin when auth refresh fails", async () => {
    const refreshTokenError = new TokenRefreshError();
    const serviceRefreshToken = sinon
      .stub()
      .resolves(failure(refreshTokenError));
    const createStub = sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);
    const { req, res, next, redirect, session } = createMocks({
      account: createAccount({ exp: getNowInSeconds() - 10 }),
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be.true;
    expect(
      serviceRefreshToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(redirect.calledOnceWithExactly("/auth/signin")).to.be.true;
    expect(next.called).to.be.false;
    expect(session.account).to.equal(undefined);
  });

  it("redirects to /select-office when no office is selected", async () => {
    const { req, res, next, redirect } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      selectedOffice: undefined,
      url: "/cases/new",
    });

    await requireAuth()(req, res, next);

    expect(redirect.calledOnceWithExactly("/select-office")).to.be.true;
    expect(next.called).to.be.false;
  });

  it("redirects to /select-office when selected office is not in LAA_ACCOUNTS", async () => {
    const { req, res, next, redirect } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      selectedOffice: createOffice("OFFICE-2"),
    });

    await requireAuth()(req, res, next);

    expect(redirect.calledOnceWithExactly("/select-office")).to.be.true;
    expect(next.called).to.be.false;
  });

  it("calls next when auth is valid and selected office is allowed", async () => {
    const { req, res, next, redirect } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1", "OFFICE-2"],
      }),
      selectedOffice: createOffice("OFFICE-2"),
    });

    await requireAuth()(req, res, next);

    expect(redirect.called).to.be.false;
    expect(next.calledOnceWithExactly()).to.be.true;
  });

  it("passes an AuthenticationError to next when LAA_ACCOUNTS has an invalid shape", async () => {
    const { req, res, next, redirect } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: 123 as unknown as string[],
      }),
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(redirect.called).to.be.false;
    expect(next.calledOnce).to.be.true;
    const [error] = next.firstCall.args;
    expect(error).to.be.instanceOf(Error);
    expect((error as Error).message).to.equal(
      "Invalid LAA_ACCOUNTS claim, expected string or string[]",
    );
  });
});

function createOffice(code: string): Office {
  return {
    address: "1 Test Street",
    code,
  };
}

function createAccount({
  exp,
  offices = ["OFFICE-1"],
}: {
  exp: number;
  offices?: string[];
}): Request["session"]["account"] {
  return {
    homeAccountId: HOME_ACCOUNT_ID,
    idToken: "id-token",
    idTokenClaims: {
      LAA_ACCOUNTS: offices,
      exp,
    },
  } as Request["session"]["account"];
}

function createMocks({
  account,
  originalUrl = "/cases/123",
  selectedOffice,
  url = "/cases/123",
}: {
  account?: Request["session"]["account"];
  originalUrl?: string;
  selectedOffice?: Office;
  url?: string;
}): {
  next: sinon.SinonStub;
  redirect: sinon.SinonStub;
  req: Request;
  res: Response;
  session: Request["session"];
} {
  const session = {
    account,
    id: SESSION_ID,
    selectedOffice,
  } as Request["session"];

  const req = {
    originalUrl,
    session,
    url,
  } as Request;

  const redirect = sinon.stub();
  const res = {
    redirect,
  } as unknown as Response;

  const next = sinon.stub();
  return { next, redirect, req, res, session };
}

function getNowInSeconds(): number {
  const MS_PER_SECOND = 1000;
  return Math.floor(Date.now() / MS_PER_SECOND);
}


