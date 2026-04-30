import config from "#/config.js";
import { createSession } from "#/lib/session.js";
import type { RedisClientType } from "#/types/redis-types.js";
import * as chai from "chai";
import type { RedisStore } from "connect-redis";
import chaiAsPromised from "chai-as-promised"
import sinon from "sinon";
chai.use(chaiAsPromised)
import { expect } from "chai";
describe("session Middleware", () => {
  let createRedisClientStub: sinon.SinonStub;
  let createRedisStoreStub: sinon.SinonStub;
  let mockRedisClient = {} as RedisClientType;
  let mockRedisStore = {} as RedisStore;

  beforeEach(() => {
    createRedisClientStub = sinon.stub().returns(mockRedisClient);
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
        createRedisClientStub,
        createRedisStoreStub,
      );
      expect(result).to.deep.equal(config.session);
    });
    it("and app environment is production, throws RedisExpected error", async () => {
      config.redis.enabled = false;
      config.app.environment = "production";
      await expect(
        createSession(
          config,
          createRedisClientStub,
          createRedisStoreStub,
        ),
      ).to.be.rejectedWith("Redis expected in production");
    });
  });

  describe("if redis is enabled", () => {
    it("creates a redis store using the redis app config", async () => {
      config.redis.enabled = true;
      const expectedConfig = { ...config.session, store: mockRedisStore };
      const result = await createSession(
        config,
        createRedisClientStub,
        createRedisStoreStub,
      );
      expect(createRedisClientStub.calledOnceWithExactly(config.redis)).to.be
        .true;
      expect(createRedisStoreStub.calledOnceWithExactly(mockRedisClient)).to.be
        .true;
    });
    it("returns session config with rediStore", async () => {
      config.redis.enabled = true;
      const expectedConfig = { ...config.session, store: mockRedisStore };
      const result = await createSession(
        config,
        createRedisClientStub,
        createRedisStoreStub,
      );
      expect(result).to.deep.equal(expectedConfig);
    });
  });
});
