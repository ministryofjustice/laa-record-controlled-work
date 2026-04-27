import sinon from "sinon";
import { RedisStore } from "#node_modules/connect-redis/dist/connect-redis.js";
import { RedisClientType } from "#node_modules/redis/dist/index.js";
import { MS_IN_TWELVE_HOURS } from "#src/constants/timeEnums.js";
import assert from "assert";
import { getSessionConfigTestCases } from "./sessionServiceFixtures.js";
import SessionService from "#src/services/sessionService.js";

describe("SessionService", () => {
    describe("getSessionConfig", () => {
      getSessionConfigTestCases.forEach(({ testName, envConfig, expected }) => {
        it(testName, async () => {
          const fakeStore = {} as RedisStore;
          const fakeRedisStoreFactory: () => Promise<RedisStore> = async () =>
            await new Promise((resolve) => {
              resolve(fakeStore);
            });
    
          const fakeClient = { connect: () => {} } as RedisClientType;
          function fakeClientFactory(): RedisClientType {
            return fakeClient;
          }
    
          const factory = SessionService.create();
          factory.setClientFactory(fakeClientFactory);
          factory.setRedisStoreFactory(fakeRedisStoreFactory);
    
          expected.store &&= fakeStore;
    
          const actual = await factory.getSessionConfig(envConfig);
    
          assert.deepEqual(actual, expected);
        });
      });
    });
    
    describe("getRedisStore", () => {
      it("should return a redis store with a connected client", async () => {
        const envConfig = {
          secret: "test-secret",
          name: "session-name",
          redis_url: "redis://redis:6379",
          resave: false,
          saveUninitialized: false,
          maxAge: MS_IN_TWELVE_HOURS,
          redis: {},
        };
        const fakeClient = { connect: () => {} } as RedisClientType;
        const clientSpy = sinon.spy(fakeClient, "connect");
    
    
        const objectToMock = {
          clientFactory: () => fakeClient,
        };
        const mocker = sinon.mock(objectToMock);
        mocker
          .expects("clientFactory")
          .once()
          .withArgs({ url: "redis://redis:6379" })
          .returns(fakeClient);
    
        const manager = SessionService.create();
        manager.setClientFactory(objectToMock.clientFactory);
    
        const actualRedisStore: RedisStore = await manager.getRedisStore(envConfig);
    
        mocker.verify();
        assert.equal(actualRedisStore.client, fakeClient);
        assert.equal(clientSpy.calledOnce, true);
      });
    });
})
