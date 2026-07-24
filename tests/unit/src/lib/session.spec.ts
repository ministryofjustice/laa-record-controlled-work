import config from "#/config.js";
import { createSession } from "#/lib/session.js";
import * as chai from "chai";
import type { RedisStore } from "connect-redis";
import chaiAsPromised from "chai-as-promised"
import sinon from "sinon";
chai.use(chaiAsPromised)
import { expect } from "chai";
import { RedisClientType } from "redis";
describe("session Middleware", () => {
  let getRedisClientStub: sinon.SinonStub;
  let createRedisStoreStub: sinon.SinonStub;
  let mockRedisClient = {} as RedisClientType;
  let mockRedisStore = {} as RedisStore;

  beforeEach(() => {
    getRedisClientStub = sinon.stub().returns(mockRedisClient);
    createRedisStoreStub = sinon.stub().resolves(mockRedisStore);
  });

  afterEach(() => {
    sinon.restore();
  });

  describe("if redis is not enabled", () => {
    it("returns session config without redis store", async () => {
      config.redis.enabled = false;
      const result = await createSession(
        config,
        getRedisClientStub,
        createRedisStoreStub,
      );
      expect(result).to.deep.equal(config.session);
    });
    it("and app environment is production, throws RedisExpected error", async () => {
      config.redis.enabled = false;
      // TODO: this works, but should be true for all deployed envs
      config.app.environment = "production";
      await expect(
        createSession(
          config,
          getRedisClientStub,
          createRedisStoreStub,
        ),
      ).to.be.rejectedWith("Redis expected in production");
    });
  });

  describe("if redis is enabled", () => {
    it("creates a redis store using the redis client", async () => {
      config.redis.enabled = true;
      await createSession(
        config,
        getRedisClientStub,
        createRedisStoreStub,
      );
      expect(getRedisClientStub.calledOnce).to.be.true;
      expect(createRedisStoreStub.calledOnceWithExactly(mockRedisClient)).to.be
        .true;
    });
    it("returns session config with rediStore", async () => {
      config.redis.enabled = true;
      const expectedConfig = { ...config.session, store: mockRedisStore };
      const result = await createSession(
        config,
        getRedisClientStub,
        createRedisStoreStub,
      );
      expect(result).to.deep.equal(expectedConfig);
    });
  });
});
