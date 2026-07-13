import config from "#/config.js";
import { createRedisClient, createRedisStore, getRedisClient } from "#/lib/redis.js";
import { logger } from "#/logger.js";
import { RedisConfig } from "#/config.types.js";
import { strict as assert } from "assert";
import { expect } from "chai";
import sinon from "sinon";

const createMockConfig = (): RedisConfig => ({
  ...config.redis,
  enabled: true,
  url: "redis://testurl",
});

describe("Redis", () => {
  describe("createRedisClient()", () => {
    let loggerInfoStub: sinon.SinonStub;
    let loggerErrorStub: sinon.SinonStub;

    beforeEach(() => {
      loggerInfoStub = sinon.stub(logger, "info");
      loggerErrorStub = sinon.stub(logger, "error");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("should create a redis client using redis protocol", () => {
      const client = createRedisClient(createMockConfig());
      const clientOptions = (client as any).options;

      assert(client, "Should return a client instance");
      assert.equal(
        (client as any).isOpen,
        false,
        "Should not connect inside createRedisClient",
      );
      assert.equal(
        clientOptions.url,
        "redis://testurl",
        "Should pass auth redis url",
      );
      assert.equal(
        clientOptions.socket.connectTimeout,
        10000,
        "Should set connect timeout",
      );
      assert.equal(
        typeof clientOptions.socket.reconnectStrategy,
        "function",
        "Should set reconnect strategy",
      );
    });

    it("should apply reconnect strategy delay and cap it at 3000ms", () => {
      const client = createRedisClient(createMockConfig());
      const reconnectStrategy = (client as any).options.socket
        .reconnectStrategy;

      assert.equal(
        reconnectStrategy(2),
        200,
        "Should use retries * 100 for lower retries",
      );
      assert.equal(
        reconnectStrategy(10),
        1000,
        "Should calculate delay for allowed retry range",
      );
      assert(
        loggerInfoStub.calledWith("Redis reconnecting", {
          delay: 200,
          retries: 2,
        }),
      );
    });

    it("should stop reconnecting after more than 10 retries", () => {
      const client = createRedisClient(createMockConfig());
      const reconnectStrategy = (client as any).options.socket
        .reconnectStrategy;
      const result = reconnectStrategy(11);

      assert(
        result instanceof Error,
        "Should return an Error after 10 retries",
      );
      assert.equal(result.message, "Redis reconnection limit exceeded");
    });

    it("should register and execute redis event handlers", () => {
      const client = createRedisClient(createMockConfig());

      client.emit("connect");
      client.emit("ready");
      client.emit("reconnecting");
      client.emit("end");
      client.emit("error", new Error("Boom"));

      assert(loggerInfoStub.calledWith("Redis client connecting"));
      assert(loggerInfoStub.calledWith("Redis client ready"));
      assert(loggerInfoStub.calledWith("Redis client reconnecting"));
      assert(loggerInfoStub.calledWith("Redis client disconnected"));
      assert(loggerErrorStub.calledWith("Redis client error", sinon.match.any));
    });
  });
  describe("getRedisClient()", () => {
    it("creates and returns a client", () => {
      const client = getRedisClient();
      expect(client).to.not.be.null;
    });

    it("returns the same instance on subsequent calls", () => {
      expect(getRedisClient()).to.equal(getRedisClient());
    });
  });
  describe("createRedisStore()", () => {
    it("should connect redis client", async () => {
      const connectStub = sinon.stub().resolves();
      const fakeClient = {
        connect: connectStub,
      } as any;

      await createRedisStore(fakeClient);
      expect(connectStub.calledOnce).to.be.true;
    });

    it("should return redis Store with redis client", async () => {
      const connectStub = sinon.stub().resolves();
      const fakeClient = {
        connect: connectStub,
      } as any;

      const store = await createRedisStore(fakeClient);
      expect(store.client).to.deep.equal(fakeClient);
    });
  });
});
