/**
 * @description Tests for the utility functions in dataTransformers work as expected
 */

import { expect } from 'chai';
import {
  safeString,
  safeOptionalString,
  isRecord,
  safeStringFromRecord,
  hasProperty
} from '#src/scripts/helpers/dataTransformers.js';

describe('Data Transformation Helpers', () => {

  describe('safeString()', () => {
    it('returns empty string for null or undefined', () => {
      expect(safeString(null)).to.equal('');
      expect(safeString(undefined)).to.equal('');
    });

    it('returns the string unchanged', () => {
      expect(safeString('hello')).to.equal('hello');
    });

    it('converts number and boolean to string', () => {
      expect(safeString(123)).to.equal('123');
      expect(safeString(true)).to.equal('true');
    });

    it('returns empty string for other types', () => {
      expect(safeString({})).to.equal('');
      expect(safeString([])).to.equal('');
      expect(safeString(() => {})).to.equal('');
    });
  });

  describe('safeOptionalString()', () => {
    it('returns undefined for null or undefined', () => {
      expect(safeOptionalString(null)).to.be.undefined;
      expect(safeOptionalString(undefined)).to.be.undefined;
    });

    it('returns string for string values', () => {
      expect(safeOptionalString('world')).to.equal('world');
    });

    it('converts number and boolean to string', () => {
      expect(safeOptionalString(0)).to.equal('0');
      expect(safeOptionalString(false)).to.equal('false');
    });

    it('returns undefined for other types', () => {
      expect(safeOptionalString({})).to.be.undefined;
      expect(safeOptionalString([])).to.be.undefined;
    });
  });

  describe('isRecord()', () => {
    it('returns true for plain objects', () => {
      expect(isRecord({ a: 1 })).to.be.true;
    });

    it('returns false for null, arrays, functions, and primitives', () => {
      expect(isRecord(null)).to.be.false;
      expect(isRecord([])).to.be.false;
      expect(isRecord(() => {})).to.be.false;
      expect(isRecord(123)).to.be.false;
      expect(isRecord('test')).to.be.false;
    });
  });

  describe('safeStringFromRecord()', () => {
    it('returns string value for valid key with non-empty string', () => {
      const obj = { name: 'Alice' };
      expect(safeStringFromRecord(obj, 'name')).to.equal('Alice');
    });

    it('returns null if key missing or value not a non-empty string', () => {
      const obj = { name: '' };
      expect(safeStringFromRecord(obj, 'age')).to.be.null;
      expect(safeStringFromRecord(obj, 'name')).to.be.null;
      expect(safeStringFromRecord(null, 'name')).to.be.null;
    });
  });

  describe('hasProperty()', () => {
    it('returns true if object has property', () => {
      expect(hasProperty({ foo: 123 }, 'foo')).to.be.true;
    });

    it('returns false if not a record or property missing', () => {
      expect(hasProperty(null, 'foo')).to.be.false;
      expect(hasProperty({}, 'foo')).to.be.false;
      expect(hasProperty([], 'foo')).to.be.false;
    });
  });

});
