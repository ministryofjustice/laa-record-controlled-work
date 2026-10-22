import type { RedisClientType } from "redis";

import { expect } from "chai";
import sinon from "sinon";

import { TokenCacheContext } from "@azure/msal-node";
import { getMsalCacheKey } from "#/auth/msal.cache-key.js";
import { MINUTE } from "#/lib/constants/time.js";
import { RedisCachePlugin } from "#/auth/msal.plugin.js";
describe("CachePlugin", () => {
  describe("Redis", () => {
    const SESSION_ID = "test-session-id-123";
    const OTHER_SESSION_ID = "other-session-id-456";
    const CACHE_KEY = getMsalCacheKey(SESSION_ID);
    const OTHER_CACHE_KEY = getMsalCacheKey(OTHER_SESSION_ID);
    const SERIALIZED_CACHE = "serialized-cache-blob";

    let redisStub: sinon.SinonStubbedInstance<RedisClientType>;
    let plugin: RedisCachePlugin;
    let cacheContextStub: {
      cacheHasChanged: boolean;
      tokenCache: { deserialize: sinon.SinonStub; serialize: sinon.SinonStub };
    };

    beforeEach(() => {
      redisStub = {
        expire: sinon.stub(),
        get: sinon.stub(),
        pExpireAt: sinon.stub(),
        pExpireTime: sinon.stub(),
        set: sinon.stub(),
      } as sinon.SinonStubbedInstance<RedisClientType>;

      plugin = new RedisCachePlugin(redisStub, SESSION_ID);

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
        expect(redisStub.expire.called).to.be.false;
      });

      it("does not renew cache expiry when no deadline is configured", async () => {
        redisStub.get.resolves(SERIALIZED_CACHE);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
        expect(
          cacheContextStub.tokenCache.deserialize.calledWith(SERIALIZED_CACHE),
        ).to.be.true;
        expect(redisStub.expire.called).to.be.false;
      });

      it("uses the authenticated session deadline when refreshing cache expiry", async () => {
        const cacheExpiresAt = Date.now() + 30 * MINUTE;
        const deadlinePlugin = new RedisCachePlugin(
          redisStub,
          SESSION_ID,
          cacheExpiresAt,
        );
        redisStub.get.resolves(SERIALIZED_CACHE);

        await deadlinePlugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(
          redisStub.pExpireAt.calledOnceWithExactly(CACHE_KEY, cacheExpiresAt),
        ).to.be.true;
      });

      it("should read from Redis using session ID key", async () => {
        redisStub.get.resolves(null);

        await plugin.beforeCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
      });

      it("should isolate cache partitions between different session IDs", async () => {
        const otherPlugin = new RedisCachePlugin(
          redisStub,
          OTHER_SESSION_ID,
        );

        const thisSessionContext = {
          cacheHasChanged: false,
          tokenCache: {
            deserialize: sinon.stub(),
            serialize: sinon.stub(),
          },
        };
        const otherSessionContext = {
          cacheHasChanged: false,
          tokenCache: {
            deserialize: sinon.stub(),
            serialize: sinon.stub(),
          },
        };

        redisStub.get.withArgs(CACHE_KEY).resolves(SERIALIZED_CACHE);
        redisStub.get.withArgs(OTHER_CACHE_KEY).resolves("other-serialized");

        await plugin.beforeCacheAccess(
          thisSessionContext as unknown as TokenCacheContext,
        );
        await otherPlugin.beforeCacheAccess(
          otherSessionContext as unknown as TokenCacheContext,
        );

        expect(redisStub.get.calledWith(CACHE_KEY)).to.be.true;
        expect(redisStub.get.calledWith(OTHER_CACHE_KEY)).to.be.true;
        expect(
          thisSessionContext.tokenCache.deserialize.calledOnceWithExactly(
            SERIALIZED_CACHE,
          ),
        ).to.be.true;
        expect(
          otherSessionContext.tokenCache.deserialize.calledOnceWithExactly(
            "other-serialized",
          ),
        ).to.be.true;
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
        const cacheExpiresAt = Date.now() + 30 * MINUTE;
        redisStub.pExpireTime.resolves(cacheExpiresAt);
        redisStub.set.resolves(null);

        await plugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(
          redisStub.pExpireTime.calledOnceWithExactly(CACHE_KEY),
        ).to.be.true;
        expect(
          redisStub.set.calledOnceWithExactly(CACHE_KEY, SERIALIZED_CACHE, {
            PXAT: cacheExpiresAt,
          }),
        ).to.be.true;
      });

      it("does not persist changed cache without an existing expiry", async () => {
        cacheContextStub.cacheHasChanged = true;
        redisStub.pExpireTime.resolves(-2);

        let error: unknown;
        try {
          await plugin.afterCacheAccess(
            cacheContextStub as unknown as TokenCacheContext,
          );
        } catch (caught) {
          error = caught;
        }

        expect(error).to.be.instanceOf(Error);
        expect(error).to.have.property(
          "message",
          "Cannot persist MSAL cache without an expiring session",
        );
        expect(redisStub.set.called).to.be.false;
      });

      it("writes changed cache data with the authenticated session deadline", async () => {
        cacheContextStub.cacheHasChanged = true;
        const cacheExpiresAt = Date.now() + 30 * MINUTE;
        const deadlinePlugin = new RedisCachePlugin(
          redisStub,
          SESSION_ID,
          cacheExpiresAt,
        );
        redisStub.set.resolves(null);

        await deadlinePlugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(
          redisStub.set.calledOnceWithExactly(
            CACHE_KEY,
            SERIALIZED_CACHE,
            { PXAT: cacheExpiresAt },
          ),
        ).to.be.true;
      });

      it("should serialize the cache before persisting", async () => {
        cacheContextStub.cacheHasChanged = true;
        redisStub.pExpireTime.resolves(Date.now() + 30 * MINUTE);
        redisStub.set.resolves(null);

        await plugin.afterCacheAccess(
          cacheContextStub as unknown as TokenCacheContext,
        );

        expect(cacheContextStub.tokenCache.serialize.called).to.be.true;
      });
    });
  });
});
