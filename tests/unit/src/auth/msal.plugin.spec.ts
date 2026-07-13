import type { RedisClientType } from "redis";

import { expect } from "chai";
import sinon from "sinon";

import {  RedisCachePlugin } from "#/auth/msal.plugin.js";
import { TokenCacheContext } from "@azure/msal-node";
describe("CachePlugin", () => {
  describe("Redis", () => {
    const SESSION_ID = "test-session-id-123";
    const TTL_SECONDS = 3600;
    const CACHE_KEY = `msal:${SESSION_ID}`;
    const SERIALIZED_CACHE = "serialized-cache-blob";

    let redisStub: sinon.SinonStubbedInstance<RedisClientType>;
    let plugin: RedisCachePlugin;
    let cacheContextStub: {
      cacheHasChanged: boolean;
      tokenCache: { deserialize: sinon.SinonStub; serialize: sinon.SinonStub };
    };

    beforeEach(() => {
      redisStub = {
        get: sinon.stub(),
        set: sinon.stub(),
      } as sinon.SinonStubbedInstance<RedisClientType>;

      plugin = new RedisCachePlugin(redisStub, SESSION_ID, TTL_SECONDS);

      cacheContextStub = {
        cacheHasChanged: false,
        tokenCache: {
          deserialize: sinon.stub(),
          serialize: sinon.stub().returns(SERIALIZED_CACHE),
        },
      };
    });

    afterEach(() => {
      sinon.restore();
    });

    describe("beforeCacheAccess()", () => {
      it("should include prefix 'msal:' and session ID in cache key", async () => {
        redisStub.get.resolves(null);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        const callArg = redisStub.get.firstCall.args[0];
        expect(callArg).to.include("msal:");
        expect(callArg).to.include(SESSION_ID);
      });
      
      it("should not deserialize when Redis returns no cached value", async () => {
        redisStub.get.resolves(null);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
        expect(cacheContextStub.tokenCache.deserialize.called).to.be.false;
      });

      it("should deserialize when Redis cache hit", async () => {
        redisStub.get.resolves(SERIALIZED_CACHE);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
        expect(
          cacheContextStub.tokenCache.deserialize.calledWith(SERIALIZED_CACHE),
        ).to.be.true;
      });

      it("should read from Redis using session ID key", async () => {
        redisStub.get.resolves(null);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
      });
    });

    describe("afterCacheAccess()", () => {
      it("should not write to Redis when cache has not changed", async () => {
        cacheContextStub.cacheHasChanged = false;

        await plugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.set.called).to.be.false;
      });

      it("should write serialized cache to Redis when cache has changed", async () => {
        cacheContextStub.cacheHasChanged = true;
        redisStub.set.resolves(null);

        await plugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(
          redisStub.set.calledWith(CACHE_KEY, SERIALIZED_CACHE, {
            EX: TTL_SECONDS,
          }),
        ).to.be.true;
      });

      it("should serialize the cache before persisting", async () => {
        cacheContextStub.cacheHasChanged = true;
        redisStub.set.resolves(null);

        await plugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(cacheContextStub.tokenCache.serialize.called).to.be.true;
      });
    });
  });
});
