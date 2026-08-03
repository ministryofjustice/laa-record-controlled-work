import { Office } from "#/journeys/select-office/mappers/office.dto.js";
import { requireAuth } from "#/middleware/requireAuth.js";
import { expect } from "chai";
import type { Request, Response } from "express";
import sinon from "sinon";

describe("requireAuth", () => {
  afterEach(() => sinon.restore());

  it("unauthenticated request redirects to `/auth/signin`", () => {
    const { req, res, next, redirect } = createMocks();

    requireAuth(req, res, next);

    expect(redirect.calledOnceWith("/auth/signin")).to.be.true;
    expect(next.called).to.be.false;
  });

  it("authenticated request calls next()", () => {
    const { req, res, next, redirect } = createMocks({ isAuthenticated: true });

    requireAuth(req, res, next);

    expect(next.called).to.be.true;
    expect(redirect.calledWith("/auth/signin")).to.be.false;
  });

  it("stores req.originalUrl in session.returnTo when unauthenticated user has selected office", () => {
    const { req, res, next, session } = createMocks({
      originalUrl: "/some/page",
      selectedOffice: { address: "1 High Street, Leeds, LS1 1AA", code: "LEEDS-01" },
    });

    requireAuth(req, res, next);

    expect(session.returnTo).to.equal("/some/page");
  });

  it("stores /select-office in session.returnTo when selected office is missing", () => {
    const { req, res, next, session } = createMocks({
      originalUrl: "/some/page",
    });

    requireAuth(req, res, next);

    expect(session.returnTo).to.equal("/select-office");
  });

  describe("bypass routes", () => {
    const bypassPaths = [
      "/health",
      "/status",
      "/auth/signin",
      "/auth/callback",
      "/auth/some-nested/path",
    ];

    for (const path of bypassPaths) {
      it(`unauthenticated request to '${path}' calls next() without redirecting`, () => {
        const { req, res, next, redirect } = createMocks({ originalUrl: path });

        requireAuth(req, res, next);

        expect(next.calledOnce).to.be.true;
        expect(redirect.called).to.be.false;
      });
    }
  });
});

function createMocks(
  options: {
    originalUrl?: string;
    isAuthenticated?: boolean;
    selectedOffice?: Office;
  } = {},
) {
  const session = {
    isAuthenticated: options.isAuthenticated,
    selectedOffice: options.selectedOffice,
  } as Request["session"];
  const req = {
    originalUrl: options.originalUrl ?? "/",
    session,
  } as Partial<Request>;
  const redirect = sinon.stub();
  const res = { redirect, locals: {} } as Partial<Response>;
  const next = sinon.stub();
  return { req: req as Request, res: res as Response, next, redirect, session };
}
