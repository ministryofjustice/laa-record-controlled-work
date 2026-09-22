import express from "express";
import request from "supertest";

import { expect } from "chai";
import { describe, it } from "mocha";

import config from "#/config.js";
import { setupNunjucks } from "#/middleware/setupNunjucks.js";

function createViewApp() {
  const app = express();
  setupNunjucks(app);
  app.use((_req, res, next) => {
    res.locals.config = config;
    next();
  });
  app.get("/export", (req, res) => {
    res.render("export/application", {
      applicationRefNumber: req.query.reference ?? null,
      clientName: req.query.client ?? null,
    });
  });
  return app;
}

describe("export application view", () => {
  it("renders the escaped header values and local assets", async () => {
    const response = await request(createViewApp()).get("/export").query({
      client: "Jane <script> & Doe",
      reference: "CW-<123>",
    });

    expect(response.status).to.equal(200);
    expect(response.text).to.match(
      /<title>Record civil controlled work - Export<\/title>/,
    );
    expect(response.text).to.include("Jane &lt;script&gt; &amp; Doe");
    expect(response.text).to.include("CW-&lt;123&gt;");
    expect(response.text).to.match(
      /<h1[^>]*>Record Controlled Work<\/h1>/,
    );
    expect(response.text).to.match(/<img[^>]+alt="Legal Aid Agency logo"/);
    expect(response.text).to.match(
      /<link[^>]+rel="stylesheet"[^>]+href="\/css\/[^"?]+\.css"/,
    );
    expect(response.text).to.match(
      /<img[^>]+src="\/views\/icons\/laa-logo\.svg"/,
    );
    expect(response.text).to.not.include("ebd50ba0-9ed9-4003-83a8-c11ac07d9e32");
    expect(response.text).to.not.include("providerOfficeCode");
  });

  it("renders Not provided for missing client and reference values", async () => {
    const response = await request(createViewApp()).get("/export");

    expect(response.status).to.equal(200);
    expect(response.text.match(/Not provided/g)).to.have.length(2);
  });
});
