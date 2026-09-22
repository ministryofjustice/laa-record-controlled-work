import { expect } from "chai";
import { describe, it } from "mocha";
import sinon from "sinon";

import { NotFoundError } from "#/app/errors/NotFoundError.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import config from "#/config.js";
import type { Success } from "#/lib/either.js";
import { LoadApplicationForExportError } from "#/export/export.errors.js";
import { loadApplicationForExport } from "#/export/export.service.js";
import type { LoadApplicationForExportDeps } from "#/export/export.types.js";
import { getGetApplicationResponseMock } from "#orval/mocks/rcw/fakers/applications/applications.faker.gen.js";

describe("loadApplicationForExport", () => {
  const params = {
    applicationId: "123e4567-e89b-12d3-a456-426614174000",
    homeAccountId: "home-account-id",
    sessionId: "session-id",
    selectedOfficeCode: "OFFICE-A",
  };

  let getApplicationStub: sinon.SinonStub;
  let deps: LoadApplicationForExportDeps;

  beforeEach(() => {
    sinon.stub(config.api, "useMockAccessToken").value(true);
    getApplicationStub = sinon.stub();
    deps = { getApplication: getApplicationStub };
  });

  afterEach(() => {
    sinon.restore();
  });

  it("returns the validated application on a successful response", async () => {
    const application = getGetApplicationResponseMock({
      providerOfficeCode: "OFFICE-A",
    });
    getApplicationStub.resolves({ data: application, status: 200 });

    const result = (await loadApplicationForExport(deps, params)) as Success<
      ReturnType<typeof getGetApplicationResponseMock>
    >;

    expect(result.error).to.equal(undefined);
    expect(result.value).to.deep.equal(application);
  });

  it("returns NotAuthenticatedError when session credentials are unusable", async () => {
    sinon.stub(config.api, "useMockAccessToken").value(false);

    const result = await loadApplicationForExport(deps, {
      ...params,
      homeAccountId: undefined,
      sessionId: undefined,
    });

    expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    expect(getApplicationStub.called).to.equal(false);
  });

  for (const status of [401]) {
    it(`returns NotAuthenticatedError for downstream ${status}`, async () => {
      getApplicationStub.resolves({ data: {}, status });

      const result = await loadApplicationForExport(deps, params);

      expect(result.error).to.be.instanceOf(NotAuthenticatedError);
    });
  }

  for (const status of [403, 404]) {
    it(`returns NotFoundError for downstream ${status}`, async () => {
      getApplicationStub.resolves({ data: {}, status });

      const result = await loadApplicationForExport(deps, params);

      expect(result.error).to.be.instanceOf(NotFoundError);
    });
  }

  it("returns LoadApplicationForExportError for other downstream statuses", async () => {
    getApplicationStub.resolves({ data: {}, status: 500 });

    const result = await loadApplicationForExport(deps, params);

    expect(result.error).to.be.instanceOf(LoadApplicationForExportError);
  });

  it("returns LoadApplicationForExportError when the API client throws", async () => {
    getApplicationStub.rejects(new Error("network error"));

    const result = await loadApplicationForExport(deps, params);

    expect(result.error).to.be.instanceOf(LoadApplicationForExportError);
  });

  it("returns LoadApplicationForExportError for a malformed payload", async () => {
    getApplicationStub.resolves({ data: {}, status: 200 });

    const result = await loadApplicationForExport(deps, params);

    expect(result.error).to.be.instanceOf(LoadApplicationForExportError);
  });

  it("returns NotFoundError when the selected office does not own the application", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({ providerOfficeCode: "OFFICE-A" }),
      status: 200,
    });

    const result = await loadApplicationForExport(deps, {
      ...params,
      selectedOfficeCode: "OFFICE-B",
    });

    expect(result.error).to.be.instanceOf(NotFoundError);
  });

  it("returns NotFoundError when no office is selected", async () => {
    getApplicationStub.resolves({
      data: getGetApplicationResponseMock({ providerOfficeCode: "OFFICE-A" }),
      status: 200,
    });

    const result = await loadApplicationForExport(deps, {
      ...params,
      selectedOfficeCode: undefined,
    });

    expect(result.error).to.be.instanceOf(NotFoundError);
  });
});