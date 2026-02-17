/**
 * @description Test that ASCII Art banner displays on application startup
 */

import { displayAsciiBanner } from '#utils/displayAsciiBanner.js';
import { strict as assert } from 'assert';
import sinon from 'sinon';
import figlet from 'figlet';

describe('displayAsciiBanner', () => {
  let consoleLogStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let consoleClearStub: sinon.SinonStub;
  let figletStub: sinon.SinonStub;

  const successfulMockConfig = {
    SERVICE_NAME: 'Manage Your Ascii Art',
    app: { port: 1234 }
  } as any;

  const undefinedMockConfig = {
    SERVICE_NAME: ''
  } as any;

  const nullMockConfig = {
    SERVICE_NAME: null
  } as any;

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log');
    consoleErrorStub = sinon.stub(console, 'error');
    consoleClearStub = sinon.stub(console, 'clear');
    figletStub = sinon.stub(figlet, 'textSync');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should log ASCII banner correctly', () => {
    figletStub.returns('Manage Your Ascii Art');

    displayAsciiBanner(successfulMockConfig);

    assert(consoleClearStub.calledOnce, 'console.clear should be called');
    assert(consoleLogStub.calledWithMatch('Manage Your Ascii Art'), 'ASCII output should be logged');
    assert(consoleLogStub.calledWithMatch('http://localhost:1234'), 'Server link should be logged');
  });

  it('should handle missing SERVICE_NAME gracefully', () => {
    figletStub.returns('');

    displayAsciiBanner(undefinedMockConfig);

    assert(consoleErrorStub.calledWithMatch('❌ No ASCII art data generated'), 'Error should be logged');
    assert(consoleLogStub.notCalled, 'console.log should not be called if no ASCII art is generated');
  });

  it('should handle figlet error', () => {
    figletStub.throws(new Error('Figlet failure'));

    displayAsciiBanner(nullMockConfig);

    assert(consoleErrorStub.calledWithMatch('❌ Error generating ASCII art:'), 'Error should be logged on figlet failure');
  });
});
