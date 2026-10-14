import { expect } from "chai";
import { setupServer } from "msw/node";

import config from "#/config.js";
import { pdaApiHandlers } from "#msw/handlers/pda.js";

const server = setupServer(...pdaApiHandlers);

describe("PDA handlers", () => {
  before(() => server.listen({ onUnhandledRequest: "error" }));
  after(() => server.close());

  it("returns the requested office from the office-code path", async () => {
    const response = await fetch(
      `${config.api.pda.baseUrl}/provider-offices/AB12CD`,
    );
    const body = (await response.json()) as {
      office: { firmOfficeCode: string };
    };

    expect(response.status).to.equal(200);
    expect(body.office.firmOfficeCode).to.equal("AB12CD");
  });
});
