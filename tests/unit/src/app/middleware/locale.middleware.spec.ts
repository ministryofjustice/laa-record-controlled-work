import { locale } from "#/app/middleware/locale.middleware.js";
import { initializeI18nextSync } from "#/lib/i18n.js";

import { expect } from "chai";
import type { NextFunction, Request, Response } from "express";

describe("locale middleware", () => {
  before(() => {
    // Initialize i18next for the tests
    initializeI18nextSync();
  });

  it("should attach locale functions to res.locals and req.locale", () => {
    // Create mock request, response, and next function
    const req = {} as Request;
    const res = {
      locals: {},
    } as Response;
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    // Create and call the middleware.
    const middleware = locale();
    middleware(req, res, next);

    // Verify res.locals has the locale functions
    expect(res.locals.t).to.be.a("function");

    // Verify req.locale has the locale functions
    expect(req.locale).to.be.an("object");
    expect(req.locale.t).to.be.a("function");

    // Verify next() was called
    expect(nextCalled).to.be.true;
  });
});
