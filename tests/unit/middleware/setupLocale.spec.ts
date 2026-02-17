/**
 * @description Test for setupLocaleMiddleware function
 */

import { setupLocaleMiddleware } from '#middleware/setupLocale.js';
import { initializeI18nextSync } from '#src/scripts/helpers/index.js';
import { expect } from 'chai';
import type { Request, Response, NextFunction } from 'express';

describe('setupLocaleMiddleware', () => {
  before(() => {
    // Initialize i18next for the tests
    initializeI18nextSync();
  });

  it('should attach locale functions to res.locals and req.locale', () => {
    // Create mock request, response, and next function
    const req = {} as Request;
    const res = {
      locals: {}
    } as Response;
    let nextCalled = false;
    const next: NextFunction = () => {
      nextCalled = true;
    };

    // Call the middleware
    setupLocaleMiddleware(req, res, next);

    // Verify res.locals has the locale functions
    expect(res.locals.t).to.be.a('function');

    // Verify req.locale has the locale functions
    expect(req.locale).to.be.an('object');
    expect(req.locale.t).to.be.a('function');

    // Verify next() was called
    expect(nextCalled).to.be.true;
  });
});
