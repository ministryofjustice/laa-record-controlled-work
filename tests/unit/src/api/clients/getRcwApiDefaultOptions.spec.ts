import { expect } from "chai";
import { describe, it, afterEach } from "mocha";
import sinon from "sinon";

import {
  type RcwApiAuthParams,
  getRcwApiDefaultOptions,
} from "#/api/clients/getRcwApiDefaultOptions.js";
import { NotAuthenticatedError } from "#/auth/auth.errors.js";
import { EntraService } from "#/auth/entra.service.js";
import config from "#/config.js";
import { failure, success } from "#/lib/either.js";
import { logger } from "#/logger.js";

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const SESSION_ID = "session-id";
const HOME_ACCOUNT_ID = "uid.tenant";
const CORRELATION_ID = "test-correlation-id";

let useMockAccessTokenStub: sinon.SinonStub;


function createParams(
  overrides: Partial<RcwApiAuthParams> = {},
): RcwApiAuthParams {
  return {
    correlationId: CORRELATION_ID,
    homeAccountId: HOME_ACCOUNT_ID,
    sessionId: SESSION_ID,
    ...overrides,
  };
}



afterEach(() => {
  sinon.restore();

  if (ORIGINAL_NODE_ENV === undefined) {
    delete process.env.NODE_ENV;
    return;
  }

  process.env.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("getRcwApiDefaultOptions", () => {
beforeEach(() => {
  useMockAccessTokenStub = sinon
    .stub(config.api, "useMockAccessToken")
    .value(false);
});

it("returns the bearer Authorization header without a correlation ID", async () => {
  useMockAccessTokenStub.value(true);

  const options = await getRcwApiDefaultOptions(createParams({correlationId: undefined}));

  expect(options.headers).to.deep.equal({
    Authorization: "Bearer test-access-token",
  });
});

it("includes the correlation ID header when provided", async () => {
  useMockAccessTokenStub.value(true);

  const options = await getRcwApiDefaultOptions(
    createParams({ correlationId: CORRELATION_ID }),
  );

  expect(options.headers).to.deep.equal({
    Authorization: "Bearer test-access-token",
    "X-Correlation-Id": CORRELATION_ID,
  });
});

  it("returns a bearer Authorization header in test environment", async () => {
    process.env.NODE_ENV = "test";
    useMockAccessTokenStub.value(true);

    const options = await getRcwApiDefaultOptions(
      createParams({ correlationId: CORRELATION_ID }),
    );

    expect(options.headers).to.deep.equal({
      Authorization: "Bearer test-access-token",
      "X-Correlation-Id": CORRELATION_ID,
    });
  });

  it("throws NotAuthenticatedError when session id is missing outside test environment", async () => {
    process.env.NODE_ENV = "development";
    sinon.stub(logger, "error");

    const params = createParams({ sessionId: undefined });

    let error: unknown;
    try {
      await getRcwApiDefaultOptions(params);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(NotAuthenticatedError);
  });

  it("throws NotAuthenticatedError when msal homeAccountId is missing", async () => {
    process.env.NODE_ENV = "development";
    sinon.stub(logger, "warn");

    const params = createParams({ homeAccountId: undefined });

    let error: unknown;
    try {
      await getRcwApiDefaultOptions(params);
    } catch (err) {
      error = err;
    }

    expect(error).to.be.instanceOf(NotAuthenticatedError);
  });

  it("uses session-scoped MSAL silent acquisition with explicit downstream scopes", async () => {
    process.env.NODE_ENV = "development";

    const acquireDownstreamAccessToken = sinon
      .stub()
      .resolves(success("downstream-access-token"));
    const createStub = sinon.stub(EntraService, "create").returns({
      acquireDownstreamAccessToken,
    } as unknown as EntraService);

    const options = await getRcwApiDefaultOptions(
      createParams(),
    );

    expect(createStub.calledOnceWithExactly({ sessionId: SESSION_ID })).to.be.true;
    expect(
      acquireDownstreamAccessToken.calledOnceWithExactly(
        HOME_ACCOUNT_ID,
        config.entra.scopes,
      ),
    ).to.be.true;
    expect(options.headers).to.deep.equal({
      Authorization: "Bearer downstream-access-token",
      "X-Correlation-Id": CORRELATION_ID,
    });
  });

  it("propagates reauthentication outcome from EntraService", async () => {
    process.env.NODE_ENV = "development";

    const notAuthenticatedError = new NotAuthenticatedError();
    sinon.stub(EntraService, "create").returns({
      acquireDownstreamAccessToken: sinon
        .stub()
        .resolves(failure(notAuthenticatedError)),
    } as unknown as EntraService);

    let error: unknown;
    try {
      await getRcwApiDefaultOptions(createParams());
    } catch (err) {
      error = err;
    }

    expect(error).to.equal(notAuthenticatedError);
  });
});
