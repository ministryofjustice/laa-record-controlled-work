import config from '#/config.js';
import { createRedisClient } from '#/lib/redis.js';
import { RedisConfig } from '#/types/config-types.js';
import { strict as assert } from 'assert';
import sinon from 'sinon';


describe('createRedisClient', () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });


  it('should create a redis client using redis protocol', () => {


    const client = createRedisClient(createMockConfig());
    const clientOptions = (client as any).options;

    assert(client, 'Should return a client instance');
    assert.equal((client as any).isOpen, false, 'Should not connect inside createRedisClient');
    assert.equal(clientOptions.password, 'secret-token', 'Should pass auth token as password');
    assert.equal(clientOptions.socket.connectTimeout, 10000, 'Should set connect timeout');
    assert.equal(typeof clientOptions.socket.reconnectStrategy, 'function', 'Should set reconnect strategy');
  });

  it('should apply reconnect strategy delay and cap it at 3000ms', () => {

    const client = createRedisClient(createMockConfig());
    const reconnectStrategy = (client as any).options.socket.reconnectStrategy;

    assert.equal(reconnectStrategy(2), 200, 'Should use retries * 100 for lower retries');
    assert.equal(reconnectStrategy(10), 1000, 'Should calculate delay for allowed retry range');
    assert(consoleLogStub.calledWithMatch('Redis reconnecting... attempt 2, waiting 200ms'));
  });

  it('should stop reconnecting after more than 10 retries', () => {
 
    const client = createRedisClient(createMockConfig());
    const reconnectStrategy = (client as any).options.socket.reconnectStrategy;
    const result = reconnectStrategy(11);

    assert(result instanceof Error, 'Should return an Error after 10 retries');
    assert.equal(result.message, 'Redis reconnection limit exceeded');
  });

  it('should register and execute redis event handlers', () => {

    const client = createRedisClient(createMockConfig());

    client.emit('connect');
    client.emit('ready');
    client.emit('reconnecting');
    client.emit('end');
    client.emit('error', new Error('Boom'));

    assert(consoleLogStub.calledWithMatch('Redis client connecting...'));
    assert(consoleLogStub.calledWithMatch('Redis client ready'));
    assert(consoleLogStub.calledWithMatch('Redis client reconnecting...'));
    assert(consoleLogStub.calledWithMatch('Redis client disconnected'));
    assert(consoleErrorStub.calledWithMatch('Redis Client Error:'));
  });
});

const createMockConfig = (): RedisConfig =>{
    config.redis.enabled = true
    config.redis.authToken ='secret-token'
return config.redis
}