/**
 *
 * @description Tests that a random number is created, that can be applied to file assets etc
 */

import { strict as assert } from 'assert';
import sinon from 'sinon';
import fs from 'node:fs';
import { getBuildNumber, getLatestBuildFile } from '#utils/buildHelper.js';

describe('buildHelper', () => {
  describe('getBuildNumber', () => {
    it('should return a string of digits', () => {
      const result = getBuildNumber();
      assert(/^\d+$/.test(result), 'Should be a string of digits');
    });

    it('should return a number less than 10000', () => {
      const num = parseInt(getBuildNumber(), 10);
      assert(num >= 0 && num < 10000, 'Should be between 0 and 9999');
    });
  });

  describe('getLatestBuildFile', () => {
    let readdirStub: sinon.SinonStub;

    beforeEach(() => {
      readdirStub = sinon.stub(fs, 'readdirSync');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should return the first matching file', () => {
      readdirStub.returns([
        'main.123.js',
        'main.456.js',
        'notmain.789.js',
        'main.css'
      ]);

      const result = getLatestBuildFile('public/js', 'main', 'js');
      assert.equal(result, 'main.123.js');
    });

    it('should return an empty string if no matches found', () => {
      readdirStub.returns([
        'other.123.js',
        'file.css',
        'main.js'
      ]);

      const result = getLatestBuildFile('public/js', 'main', 'js');
      assert.equal(result, '');
    });

    it('should match based on dynamic prefix and extension', () => {
      readdirStub.returns(['style.987.css', 'style.999.css', 'main.001.js']);
      const result = getLatestBuildFile('public/css', 'style', 'css');
      assert.equal(result, 'style.987.css');
    });
  });
});