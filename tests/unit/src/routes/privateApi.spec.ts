import express from "express";
import request from "supertest";

import { expect } from "chai";

import { OK } from "#/lib/constants/http.js";
import privateApiRouter from "#/routes/privateApi.js";

describe("privateApiRouter", () => {
  it("returns 200 for GET /api/private/load", async () => {
    const app = express();
    app.use("/api/private", privateApiRouter);

    const response = await request(app).get("/api/private/load");

    expect(response.status).to.equal(OK);
  });
});
