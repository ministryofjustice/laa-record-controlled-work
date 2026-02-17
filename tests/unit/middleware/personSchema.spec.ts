/**
 * Person Schema Validation Tests
 * 
 * Template examples for form validation middleware using express-validator
 * and TypedValidationError for GOV.UK Design System error formatting.
 */

import { describe, it, before } from 'mocha';
import { expect } from 'chai';
import { validatePerson } from '#src/middlewares/personSchema.js';
import { validationResult } from 'express-validator';
import { formatValidationError } from '#src/helpers/ValidationErrorHelpers.js';
import { initializeI18nextSync } from '#src/scripts/helpers/i18nLoader.js';
import type { Request } from 'express';

// Mock Express request object for testing
function createMockRequest(bodyData: Record<string, unknown>) {
  return {
    body: bodyData
  } as any;
}

describe('Person Schema Validation', () => {
  before(() => {
    // Initialize i18next for translations to work in tests
    initializeI18nextSync();
  });

  describe('validatePerson', () => {
    it('should create validation schema without throwing an error', () => {
      expect(() => validatePerson()).to.not.throw();
    });

    it('should pass validation with valid required fields', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        fullName: 'John Smith',
        address: '123 Main Street',
        contactPreference: 'email',
        priority: 'medium',
        communicationMethods: ['email']
      });

      await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
      const errors = validationResult(req);

      expect(errors.isEmpty()).to.be.true;
    });

    it('should fail validation when required fields are empty', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        fullName: '',
        address: ''
      });

      await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
      const errors = validationResult(req).formatWith(formatValidationError);

      expect(errors.isEmpty()).to.be.false;

      const nameError = errors.array().find((error: any) => 
        error.summaryMessage && error.summaryMessage.includes('Enter your full name')
      );
      const addressError = errors.array().find((error: any) => 
        error.summaryMessage && error.summaryMessage.includes('Enter your address')
      );

      expect(nameError).to.exist;
      expect(addressError).to.exist;
    });

    it('should trim whitespace from input fields', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        fullName: '  John Smith  ',
        address: '  123 Main Street  ',
        communicationMethods: ['email']
      });

      await Promise.all(schema.map((validation: any) => validation.run(req as Request)));

      expect(req.body.fullName).to.equal('John Smith');
      expect(req.body.address).to.equal('123 Main Street');
    });

    it('should format errors correctly for GOV.UK components', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        fullName: '',
        address: ''
      });

      await Promise.all(schema.map((validation: any) => validation.run(req as Request)));
      const errors = validationResult(req).formatWith(formatValidationError);

      expect(errors.isEmpty()).to.be.false;

      const errorArray = errors.array();
      for (const errorData of errorArray) {
        expect(errorData).to.have.property('summaryMessage');
        expect(errorData).to.have.property('inlineMessage');
        expect(errorData.summaryMessage).to.be.a('string');
        expect(errorData.inlineMessage).to.be.a('string');
      }
    });
  });
});