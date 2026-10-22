import { AuthError, type AuthenticationResult } from "@azure/msal-node";

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
import { HTTP_STATUS } from "#/lib/constants/http.js";
import { HOUR, MINUTE } from "#/lib/constants/time.js";

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
  });

  it("redirects to /auth/signin when auth token is missing", async () => {
    const { req, res, next, redirect, session } = createMocks({
      account: undefined,
    });

    await requireAuth()(req, res, next);

    expect(redirect.calledOnceWithExactly("/auth/signin")).to.be.true;
    expect(next.called).to.be.false;
    expect(session.account).to.equal(undefined);
  });

  it("requires interactive sign-in for authenticated sessions without lifetime metadata", async () => {
    const { req, res, next, redirect, destroy, clearCookie } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      omitLifetimeMetadata: true,
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(destroy.calledOnce).to.be.true;
    expect(clearCookie.calledOnceWithExactly(config.session.name)).to.be.true;
    expect(redirect.calledOnceWithExactly("/auth/signin?prompt=login")).to.be
      .true;
    expect(next.called).to.be.false;
  });

  it("rejects an idle session before checking its token", async () => {
    const now = Date.now();
    sinon.useFakeTimers({ now, toFake: ["Date"] });
    const { req, res, next, redirect, destroy, clearCookie } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      authenticatedAt: now - HOUR,
      lastActivityAt: now - 30 * MINUTE,
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(destroy.calledOnce).to.be.true;
    expect(clearCookie.calledOnceWithExactly(config.session.name)).to.be.true;
    expect(redirect.calledOnceWithExactly("/auth/signin?prompt=login")).to.be
      .true;
    expect(next.called).to.be.false;
  });

  it("renews activity from server time and ignores browser timestamps", async () => {
    const now = Date.now();
    sinon.useFakeTimers({ now, toFake: ["Date"] });
    const { req, res, next, session } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      authenticatedAt: now - HOUR,
      body: { activityTimestamp: now + HOUR },
      lastActivityAt: now - 29 * MINUTE,
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(session.lastActivityAt).to.equal(now);
    expect(session.cookie.maxAge).to.equal(30 * MINUTE);
    expect(next.calledOnce).to.be.true;
  });

  it("caps renewed activity at the absolute session deadline", async () => {
    const now = Date.now();
    sinon.useFakeTimers({ now, toFake: ["Date"] });
    const { req, res, next, session } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: ["OFFICE-1"],
      }),
      authenticatedAt: now - (12 * HOUR - 5 * MINUTE),
      lastActivityAt: now - MINUTE,
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(session.lastActivityAt).to.equal(now);
    expect(session.cookie.maxAge).to.equal(5 * MINUTE);
    expect(next.calledOnce).to.be.true;
  });

  it("does not reset the absolute deadline when refreshing an expired token", async () => {
    const now = Date.now();
    sinon.useFakeTimers({ now, toFake: ["Date"] });
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
    sinon.stub(EntraService, "create").returns({
      refreshToken: serviceRefreshToken,
    } as unknown as EntraService);
    const authenticatedAt = now - (12 * HOUR - 5 * MINUTE);
    const { req, res, next, session } = createMocks({
      account: createAccount({ exp: getNowInSeconds() - 10 }),
      authenticatedAt,
      lastActivityAt: now - MINUTE,
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(session.authenticatedAt).to.equal(authenticatedAt);
    expect(session.lastActivityAt).to.equal(now);
    expect(session.cookie.maxAge).to.equal(5 * MINUTE);
    expect(next.calledOnce).to.be.true;
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

    expect(
      createStub.calledOnceWithExactly({
        cacheExpiresAt: sinon.match.number,
        sessionId: SESSION_ID,
      }),
    ).to.be.true;
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

    expect(
      createStub.calledOnceWithExactly({
        cacheExpiresAt: sinon.match.number,
        sessionId: SESSION_ID,
      }),
    ).to.be.true;
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

  it("renders the no-assigned-role error page when Entra reports the user has no role", async () => {
    const refreshTokenMock = sinon
      .stub()
      .rejects(
        new AuthError("1003009", "test-correlation-id", "No assigned role"),
      );

    sinon.stub(EntraService, "create").returns({
      refreshToken: refreshTokenMock,
    } as unknown as EntraService);

    const { req, res, next, redirect, render, status } = createMocks({
      account: createAccount({ exp: getNowInSeconds() - 10 }),
      selectedOffice: createOffice("OFFICE-1"),
    });

    await requireAuth()(req, res, next);

    expect(status.calledOnceWithExactly(HTTP_STATUS.FORBIDDEN)).to.be.true;
    expect(render.calledOnceWithExactly("main/error-no-assigned-role")).to.be
      .true;
    expect(redirect.called).to.be.false;
    expect(next.called).to.be.false;
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

  it("renders a 403 Forbidden error page when the user has no assigned offices", async () => {
    const { req, res, next, status, render } = createMocks({
      account: createAccount({
        exp: getNowInSeconds() + 600,
        offices: [],
      }),
    });

    await requireAuth()(req, res, next);

    expect(status.calledOnceWithExactly(HTTP_STATUS.FORBIDDEN)).to.be.true;
    expect(render.calledOnceWithExactly("main/error-no-assigned-office")).to.be
      .true;
    expect(next.called).to.be.false;
  });

  it("allows an authenticated user without a selected office to access /select-office", async () => {
    const { req, res, next, redirect, session } = createMocks({
      account: createAccount({ exp: getNowInSeconds() + 600 }),
      originalUrl: "/select-office",
      path: "/select-office",
      selectedOffice: undefined,
      url: "/select-office",
    });

    await requireAuth()(req, res, next);

    expect(redirect.called).to.be.false;
    expect(next.calledOnceWithExactly()).to.be.true;
    expect(res.locals.isAuthenticated).to.be.true;
    expect(res.locals.user).to.equal(session.account);
  });

  it("redirects an unauthenticated user from /select-office to /auth/signin", async () => {
    const { req, res, next, redirect } = createMocks({
      account: undefined,
      originalUrl: "/select-office",
      path: "/select-office",
      selectedOffice: undefined,
      url: "/select-office",
    });

    await requireAuth()(req, res, next);

    expect(redirect.calledOnceWithExactly("/auth/signin")).to.be.true;
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
  authenticatedAt,
  body,
  lastActivityAt,
  omitLifetimeMetadata = false,
  originalUrl = "/cases/123",
  path = "/cases/123",
  selectedOffice,
  url = "/cases/123",
}: {
  account?: Request["session"]["account"];
  authenticatedAt?: number;
  body?: unknown;
  lastActivityAt?: number;
  omitLifetimeMetadata?: boolean;
  originalUrl?: string;
  path?: string;
  selectedOffice?: Office;
  url?: string;
}): {
  next: sinon.SinonStub;
  clearCookie: sinon.SinonStub;
  destroy: sinon.SinonStub;
  render: sinon.SinonStub;
  redirect: sinon.SinonStub;
  req: Request;
  res: Response;
  session: Request["session"];
  status: sinon.SinonStub;
} {
  const now = Date.now();
  const session = {
    account,
    id: SESSION_ID,
    selectedOffice,
    cookie: { maxAge: config.session.cookie.maxAge },
    destroy: sinon.stub().callsArgWith(0, null),
  } as Request["session"];
  if (!omitLifetimeMetadata) {
    session.authenticatedAt = authenticatedAt ?? now;
    session.lastActivityAt = lastActivityAt ?? now;
  }

  const req = {
    body,
    originalUrl,
    path,
    session,
    url,
  } as Request;

  const redirect = sinon.stub();
  const render = sinon.stub();
  const status = sinon.stub();
  const res = {
    locals: {},
    clearCookie: sinon.stub(),
    redirect,
    render,
    status,
  } as unknown as Response;
  status.returns(res);

  const next = sinon.stub();
  return {
    clearCookie: res.clearCookie as sinon.SinonStub,
    destroy: session.destroy as sinon.SinonStub,
    next,
    redirect,
    render,
    req,
    res,
    session,
    status,
  };
}

function getNowInSeconds(): number {
  const MS_PER_SECOND = 1000;
  return Math.floor(Date.now() / MS_PER_SECOND);
}
