import express from "express";
import request from "supertest";

import { expect } from "chai";
import sinon from "sinon";

import { INTERNAL_SERVER_ERROR, NOT_FOUND, OK } from "#/lib/constants/http.js";
import { logger } from "#/logger.js";
import {
  logFailureStatusCodes,
  logRouteErrors,
} from "#/routes/privateApi.js";
import privateApiRouter from "#/routes/privateApi.js";

describe("privateApiRouter", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("returns 200 for GET /api/private/load", async () => {
    const app = express();
    app.use("/api/private", privateApiRouter);

    const response = await request(app).get("/api/private/load");

    expect(response.status).to.equal(OK);
  });

  it("logs warning for unknown private route failures", async () => {
    const loggerWarnStub = sinon.stub(logger, "warn");
    const app = express();
    app.use("/api/private", privateApiRouter);

    const response = await request(app).get("/api/private/missing");

    expect(response.status).to.equal(NOT_FOUND);
    expect(loggerWarnStub.calledOnce).to.be.true;
    expect(loggerWarnStub.calledWith(
      "Private API request returned failure status",
      sinon.match({
        method: "GET",
        path: "/api/private/missing",
        statusCode: NOT_FOUND,
      }),
    )).to.be.true;
  });

  it("logs warning when downstream handler returns 500", async () => {
    const loggerWarnStub = sinon.stub(logger, "warn");
    const app = express();
    app.use("/api/private", privateApiRouter);
    app.get("/api/private/boom", () => {
      throw new Error("boom");
    });
    app.use((_err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.sendStatus(INTERNAL_SERVER_ERROR);
    });

    const response = await request(app).get("/api/private/boom");

    expect(response.status).to.equal(INTERNAL_SERVER_ERROR);
    expect(loggerWarnStub.calledOnce).to.be.true;
    expect(loggerWarnStub.calledWith(
      "Private API request returned failure status",
      sinon.match({
        method: "GET",
        path: "/api/private/boom",
        statusCode: INTERNAL_SERVER_ERROR,
      }),
    )).to.be.true;
  });

  it("logs error message and stack trace in error middleware", () => {
    const loggerErrorStub = sinon.stub(logger, "error");
    const boomError = new Error("private route exploded");
    const req = {
      method: "GET",
      originalUrl: "/api/private/load",
    } as express.Request;
    const res = {
      locals: {},
      statusCode: INTERNAL_SERVER_ERROR,
    } as express.Response;
    const next = sinon.stub();

    logRouteErrors(boomError, req, res, next);

    expect(loggerErrorStub.calledOnce).to.be.true;
    expect(loggerErrorStub.calledWith(
      "Private API route error",
      boomError,
      sinon.match({
        method: "GET",
        path: "/api/private/load",
        errorMessage: "private route exploded",
        errorStack: sinon.match.string,
      }),
    )).to.be.true;
    expect(next.calledOnceWithExactly(boomError)).to.be.true;
  });

  it("includes error message and stack in failure status logs", () => {
    const loggerWarnStub = sinon.stub(logger, "warn");
    const boomError = new Error("private route exploded");
    let finishListener: (() => void) | undefined;
    const req = {
      method: "GET",
      originalUrl: "/api/private/load",
    } as express.Request;
    const res = {
      locals: {
        privateApiError: boomError,
      },
      on: (_event: string, callback: () => void) => {
        finishListener = callback;
        return res;
      },
      statusCode: INTERNAL_SERVER_ERROR,
    } as unknown as express.Response;
    const next = sinon.stub();

    logFailureStatusCodes(req, res, next);
    finishListener?.();

    expect(next.calledOnce).to.be.true;
    expect(loggerWarnStub.calledOnce).to.be.true;
    expect(loggerWarnStub.calledWith(
      "Private API request returned failure status",
      sinon.match({
        statusCode: INTERNAL_SERVER_ERROR,
        errorMessage: "private route exploded",
        errorStack: sinon.match.string,
      }),
    )).to.be.true;
  });
});
