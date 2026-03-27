/**
 * @description Test for i18nLoader functions
 */

import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'node:fs';
import path from 'node:path';
import {
  initializeI18nextSync,
  i18next,
  t,
  nunjucksT
} from '#src/scripts/helpers/i18nLoader.js';

describe('i18nLoader', () => {
  let consoleWarnStub: sinon.SinonStub;
  let consoleErrorStub: sinon.SinonStub;
  let readFileSyncStub: sinon.SinonStub;

  before(() => {
    consoleWarnStub = sinon.stub(console, 'warn');
    consoleErrorStub = sinon.stub(console, 'error');
  });

  after(() => {
    sinon.restore();
  });

  describe('initializeI18nextSync', () => {
    beforeEach(() => {
      readFileSyncStub = sinon.stub(fs, 'readFileSync');
    });

    afterEach(() => {
      readFileSyncStub.restore();
    });

    it('should initialize i18next with locale data when file exists', () => {
      const mockLocaleData = {
        common: { back: 'Back', save: 'Save' },
        pages: { title: 'Page Title' }
      };

      readFileSyncStub.returns(JSON.stringify(mockLocaleData));

      initializeI18nextSync();

      expect(i18next.isInitialized).to.be.true;
      expect(t('common.back')).to.equal('Back');
      expect(t('pages.title')).to.equal('Page Title');
    });

    it('should initialize with empty resources when locale file not found', () => {
      readFileSyncStub.throws(new Error('File not found'));

      initializeI18nextSync();

      expect(consoleWarnStub.calledWith('Locale file not found, initializing with empty resources')).to.be.true;
      expect(i18next.isInitialized).to.be.true;
    });

    it('should handle JSON parse errors gracefully', () => {
      readFileSyncStub.returns('invalid json');

      initializeI18nextSync();

      expect(consoleWarnStub.calledWith('Locale file not found, initializing with empty resources')).to.be.true;
      expect(i18next.isInitialized).to.be.true;
    });

    it('should handle general initialization errors', () => {
      sinon.stub(path, 'join').throws(new Error('Path error'));

      initializeI18nextSync();

      expect(consoleErrorStub.calledWithMatch('Failed to initialise i18next synchronously:')).to.be.true;
      expect(i18next.isInitialized).to.be.true;
    });
  });

  describe('translation functions', () => {
    let i18nextStub: sinon.SinonStub;
    let i18nextExistsStub: sinon.SinonStub;

    before(() => {
      // Stub i18next methods directly instead of trying to initialize
      i18nextStub = sinon.stub(i18next, 't');
      i18nextExistsStub = sinon.stub(i18next, 'exists');

      // Setup return values for our test cases
      i18nextStub.withArgs('back').returns('Back');
      i18nextStub.withArgs('greeting', { name: 'John' }).returns('Hello John');
      i18nextStub.withArgs('nonexistent.key').returns('nonexistent.key');

      i18nextExistsStub.withArgs('back').returns(true);
      i18nextExistsStub.withArgs('nonexistent').returns(false);

      // Ensure isInitialized is true
      Object.defineProperty(i18next, 'isInitialized', { value: true, writable: true });
    });

    after(() => {
      i18nextStub.restore();
      i18nextExistsStub.restore();
    });

    describe('t', () => {
      it('should return translated text for valid keys', () => {
        // With defaultNS: 'common', we can access keys directly
        expect(t('back')).to.equal('Back');
      });

      it('should handle interpolation', () => {
        expect(t('greeting', { name: 'John' })).to.equal('Hello John');
      });

      it('should return key when translation not found', () => {
        expect(t('nonexistent.key')).to.equal('nonexistent.key');
      });

      it('should return key when i18next not initialized', () => {
        const originalIsInitialized = i18next.isInitialized;
        Object.defineProperty(i18next, 'isInitialized', { value: false, writable: true });

        const result = t('back');

        expect(consoleWarnStub.calledWith('i18next not initialised when translating: back')).to.be.true;
        expect(result).to.equal('back');

        Object.defineProperty(i18next, 'isInitialized', { value: originalIsInitialized, writable: true });
      });
    });

    describe('nunjucksT', () => {
      it('should return same result as t function', () => {
        expect(nunjucksT('back')).to.equal(t('back'));
      });
    });
  });
});
