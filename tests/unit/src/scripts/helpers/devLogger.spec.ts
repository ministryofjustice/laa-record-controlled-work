/**
 * @description Tests that the utility functions work in the expected environments
 */

import { expect } from 'chai';
import sinon from 'sinon';
import {
  devLog,
  devWarn,
  devError,
  devDebug,
  isDevelopment
} from '#src/scripts/helpers/devLogger.js';

describe('Development Logging Utilities', () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let consoleDebugStub: sinon.SinonStub;
  let originalNodeEnv: string | undefined;

  before(() => {
    originalNodeEnv = process.env.NODE_ENV;
  });

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
    consoleDebugStub = sinon.stub(console, 'debug');
  });

  afterEach(() => {
    // Restore stubs
    sinon.restore();
    // Reset NODE_ENV to original after each test
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('logs messages only in development or undefined NODE_ENV', () => {
    process.env.NODE_ENV = 'development';

    devLog('log message');
    devWarn('warn message');
    devError('error message');
    devDebug('debug message');

    expect(consoleLogStub.calledWith('log message')).to.be.true;
    expect(consoleWarnStub.calledWith('warn message')).to.be.true;
    expect(consoleErrorStub.calledWith('error message')).to.be.true;
    expect(consoleDebugStub.calledWith('debug message')).to.be.true;
  });

  it('does not log messages in production NODE_ENV', () => {
    process.env.NODE_ENV = 'production';

    devLog('log message');
    devWarn('warn message');
    devError('error message');
    devDebug('debug message');

    expect(consoleLogStub.called).to.be.false;
    expect(consoleWarnStub.called).to.be.false;
    expect(consoleErrorStub.called).to.be.false;
    expect(consoleDebugStub.called).to.be.false;
  });

  it('isDevelopment returns true in development or undefined', () => {
    process.env.NODE_ENV = 'development';
    expect(isDevelopment()).to.be.true;

    delete process.env.NODE_ENV;
    expect(isDevelopment()).to.be.true;
  });

  it('isDevelopment returns false otherwise', () => {
    process.env.NODE_ENV = 'production';
    expect(isDevelopment()).to.be.false;

    process.env.NODE_ENV = 'test';
    expect(isDevelopment()).to.be.false;
  });
});