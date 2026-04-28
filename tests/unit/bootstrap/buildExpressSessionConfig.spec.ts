import config from "#config.js";
import sinon from "sinon";
import { MemoryStore } from "express-session";
import { Config } from "#types/config-types.js";
import { buildExpressSessionConfig } from "#bootstrap/buildExpressSessionConfig.js";
import assert from "node:assert";

describe('buildSessionConfig', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should build Redis session config and connect client when not open', async () => {
    const config = createMockConfig(true);
    const connectStub = sinon.stub().resolves();
    const fakeClient = {
      isOpen: false,
      connect: connectStub,
    } as any;

    const redisClientFactory = sinon.stub().returns(fakeClient);

    const result = await buildExpressSessionConfig(config, redisClientFactory);

    assert(redisClientFactory.calledOnceWithExactly(config.redis), 'Redis factory should be called with redis config');
    assert(connectStub.calledOnce, 'Client connect should be called when client is not open');
    assert(result.store, 'Session store should be set');
    assert(!(result.store instanceof MemoryStore), 'Store should not be MemoryStore when Redis is enabled');
    assert.equal(result.secret, config.expressSession.secret, 'Session secret should be preserved');
  });

  it('should not reconnect Redis client when already open', async () => {
    const config = createMockConfig(true);
    const connectStub = sinon.stub().resolves();
    const fakeClient = {
      isOpen: true,
      connect: connectStub,
    } as any;

    const redisClientFactory = sinon.stub().returns(fakeClient)

    const result = await buildExpressSessionConfig(config, redisClientFactory);


    assert(redisClientFactory.calledOnce, 'Redis factory should be called');
    assert(connectStub.notCalled, 'Client connect should not be called when client is already open');
    assert(result.store, 'Session store should be set');
  });

  it('should build in-memory session config when Redis is disabled', async () => {
    const config = createMockConfig(false);
    const redisClientFactory = sinon.stub();

    const result = await buildExpressSessionConfig(config, redisClientFactory);

    assert(redisClientFactory.notCalled, 'Redis factory should not be called when Redis is disabled');
    assert(result.store instanceof MemoryStore, 'Store should be MemoryStore when Redis is disabled');
    assert.equal(result.name, config.expressSession.name, 'Session name should be preserved');
  });
});


const createMockConfig = (redisEnabled: boolean, ): Config => {
  config.redis.enabled = redisEnabled
  config.redis.authToken = "redis-token"
  return config
};