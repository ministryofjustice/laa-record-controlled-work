import express, { Express } from "express";
import { handleGlobalErrors } from "#/app/middleware/handleGlobalErrors.middleware.js";
import request from "supertest";
import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { NotFoundError } from "#/app/errors/NotFoundError.js";
import { expect } from "chai";
import { ApplicationError } from "#/app/errors/ApplicationError.js";
import nunjucks from "nunjucks";
import path from "node:path";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";
import fs from "fs";
import { ForbiddenError } from "#/app/errors/ForbiddenError.js";
import { UnauthorizedError } from "#/app/errors/UnauthorizedError.js";

let app: Express;

describe("HandleGlobalErrors middleware", () => {
  beforeEach(() => {
    app = express();
    app.set("view engine", "njk");
    setupNunjucks(app);
  });

  it("Has no impact when no global error is thrown", async () => {
    app.get("/test", (req, res) => {
      res.status(HTTP_STATUS.OK).send("OK");
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/test");
    expect(res.status).to.equal(HTTP_STATUS.OK);
    expect(res.text).to.equal("OK");
  });

  it("Redirects to `/auth/signin` when `UnauthorizedError` is thrown", async () => {
    app.get("/throws", (req, res) => {
      throw new UnauthorizedError();
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");
    expect(res.status).to.equal(HTTP_STATUS.FOUND);
    expect(res.headers.location).to.equal("/auth/signin");
  });

  it("Returns HTTP 404 when `ForbiddenError` is thrown", async () => {
    app.get("/throws", (req, res) => {
      throw new ForbiddenError();
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");
    expect(res.status).to.equal(HTTP_STATUS.NOT_FOUND);
  });

  it("Displays the 404 error page when `ForbiddenError` is thrown", async () => {
    app.get("/throws", (req, res, next) => {
      throw new ForbiddenError();
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");

    // Assert against the page heading and a portion of body text.
    expect(res.text).to.include("Page not found");
    expect(res.text).to.include("If you typed the web address");
  });

  it("Returns HTTP 404 when `NotFoundError` is thrown", async () => {
    app.get("/throws", (req, res) => {
      throw new NotFoundError();
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");
    expect(res.status).to.equal(HTTP_STATUS.NOT_FOUND);
  });

  it("Displays the 404 error page when `NotFoundError` is thrown", async () => {
    app.get("/throws", (req, res, next) => {
      throw new NotFoundError();
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");

    // Assert against the page heading and a portion of body text.
    expect(res.text).to.include("Page not found");
    expect(res.text).to.include("If you typed the web address");
  });

  it("Returns HTTP 500 when `ApplicationError` is thrown", async () => {
    app.get("/throws", (req, res) => {
      throw new ApplicationError("Server error");
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");
    expect(res.status).to.equal(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("Displays the 500 error page when `ApplicationError` is thrown", async () => {
    app.get("/throws", (req, res, next) => {
      throw new ApplicationError("Resource not found");
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");

    // Assert against the page heading and a portion of body text.
    expect(res.text).to.include("Sorry, there is a problem with the service");
    expect(res.text).to.include("Try again later.");
  });

  it("Returns HTTP 500 when an unknown error is thrown", async () => {
    app.get("/throws", (req, res) => {
      throw new Error("Unknown error");
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");
    expect(res.status).to.equal(HTTP_STATUS.INTERNAL_SERVER_ERROR);
  });

  it("Displays the 500 error page when an unknown error is thrown", async () => {
    app.get("/throws", (req, res, next) => {
      throw new Error("Unknown error");
    });
    app.use(handleGlobalErrors());

    const res = await request(app).get("/throws");

    // Assert against the page heading and a portion of body text.
    expect(res.text).to.include("Sorry, there is a problem with the service");
    expect(res.text).to.include("Try again later.");
  });
});
