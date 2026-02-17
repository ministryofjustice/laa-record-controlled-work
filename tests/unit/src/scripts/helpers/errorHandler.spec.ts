/**
 * @description Tests that these utility functions handle error for our API requests
 */

import { strict as assert } from 'assert';
import sinon from 'sinon';
import {
  extractErrorMessage,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isServerError,
  createProcessedError,
  extractAndLogError,
} from '#src/scripts/helpers/errorHandler.js';

describe('errorHandler', () => {
  beforeEach(() => {
    sinon.stub(console, 'log');
    sinon.stub(console, 'error');
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('extractErrorMessage', () => {
    it('returns user-friendly message for axios-like error with status', () => {
      const axiosError = {
        response: { status: 404, data: {}, statusText: 'Not Found' }
      };
      const result = extractErrorMessage(axiosError);
      assert.strictEqual(result, 'The requested information could not be found.');
    });

    it('extracts message from response.data.message if available', () => {
      const axiosError = {
        response: {
          status: 400,
          data: { message: 'Invalid input field' },
          statusText: 'Bad Request',
        }
      };
      const result = extractErrorMessage(axiosError);
      assert.strictEqual(result, 'Invalid input field');
    });

    it('returns user-friendly message for known network error codes', () => {
      const networkError = { code: 'ECONNREFUSED' };
      const result = extractErrorMessage(networkError);
      assert.strictEqual(result, 'Unable to connect to the service. Please try again later.');
    });

    it('returns fallback message for unknown object', () => {
      const result = extractErrorMessage({ foo: 'bar' });
      assert.strictEqual(result, 'An unexpected error occurred. Please try again.');
    });

    it('returns message for string error', () => {
      const result = extractErrorMessage('some string error');
      assert.strictEqual(result, 'An error occurred. Please try again.');
    });

    it('returns fallback message for null error', () => {
      const result = extractErrorMessage(null);
      assert.strictEqual(result, 'An unexpected error occurred. Please try again.');
    });
  });

  describe('status code helpers', () => {
    it('isAuthError returns true for 401', () => {
      const error = { response: { status: 401 } };
      assert.strictEqual(isAuthError(error), true);
    });

    it('isForbiddenError returns true for 403', () => {
      const error = { response: { status: 403 } };
      assert.strictEqual(isForbiddenError(error), true);
    });

    it('isNotFoundError returns true for 404', () => {
      const error = { response: { status: 404 } };
      assert.strictEqual(isNotFoundError(error), true);
    });

    it('isServerError returns true for 500', () => {
      const error = { response: { status: 500 } };
      assert.strictEqual(isServerError(error), true);
    });
  });

  describe('createProcessedError', () => {
    it('returns Error with expected message and cause', () => {
      const inputError = new Error('Original');
      const result = createProcessedError(inputError, 'doing something');
      assert(result instanceof Error);
      assert.strictEqual(result.message, 'An unexpected error occurred. Please try again.');
      assert.strictEqual(result.cause, inputError);
    });
  });

  describe('extractAndLogError', () => {
    it('returns message and logs context (no assertion on devError)', () => {
      const error = { response: { status: 403 } };
      const result = extractAndLogError(error, 'testing context');
      assert.strictEqual(result, 'You do not have permission to access this resource.');
    });
  });
});