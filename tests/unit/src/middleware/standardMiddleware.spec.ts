/**
 * @description Test that setting up middleware was processed
 */

import { standardMiddleware } from '#/middleware/standardMiddleware.js';
import express from 'express';
import { expect } from 'chai';

describe('setupMiddlewares', () => {
  it('should set up middleware without throwing an error', () => {
    const app = express();
    // this does not assert that middleware is working correctly, just that it was set-up
    expect(() => standardMiddleware(app)).to.not.throw();
  });
});