import { expect } from 'chai';
import { validationResult, type ValidationChain } from 'express-validator';
import type { Request } from 'express';
import { validatePerson } from '../../../src/middlewares/personSchema.js';
import { formatValidationError } from '../../../src/helpers/ValidationErrorHelpers.js';
import { initializeI18nextSync } from '../../../src/scripts/helpers/i18nLoader.js';

interface TestRequest extends Partial<Request> {
  body: Record<string, any>;
}

function createMockRequest(body: Record<string, any>): TestRequest {
  // Ensure all required fields are present with defaults
  const completeBody = {
    fullName: 'John Smith',
    address: '123 Test Street',
    contactPreference: 'email',
    priority: 'medium',
    communicationMethods: ['email'], // Required field for validation
    ...body // Override with provided values
  };
  
  return {
    body: completeBody,
    get: (name: string) => undefined,
    header: (name: string) => undefined,
    headers: {},
    method: 'POST',
    url: '/test',
    path: '/test'
  };
}

describe('Date Field Validation', () => {
  before(() => {
    // Initialize i18next for translations to work in tests
    initializeI18nextSync();
  });

  describe('validatePerson - Date Field Patterns', () => {
    
    it('should pass validation when no date fields are provided', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        // No date fields provided - using defaults for required fields
      });

      await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
      const errors = validationResult(req);

      expect(errors.isEmpty()).to.be.true;
    });

    it('should require all date components when any component is provided', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '',
        'dateOfBirth-year': ''
      });

      await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
      const errors = validationResult(req).formatWith(formatValidationError);

      expect(errors.isEmpty()).to.be.false;
      const errorArray = errors.array();
      expect(errorArray.some((error: any) => 
        error.summaryMessage && error.summaryMessage.includes('Date of birth must include a month')
      )).to.be.true;
      expect(errorArray.some((error: any) => 
        error.summaryMessage && error.summaryMessage.includes('Date of birth must include a year')  
      )).to.be.true;
    });

    it('should pass validation with complete valid date', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        'dateOfBirth-day': '15',
        'dateOfBirth-month': '6',
        'dateOfBirth-year': '1990'
      });

      await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
      const errors = validationResult(req);

      expect(errors.isEmpty()).to.be.true;
    });

    it('should fail validation with invalid date values', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        'dateOfBirth-day': '32',    // Invalid day
        'dateOfBirth-month': '13',  // Invalid month  
        'dateOfBirth-year': '90'    // Invalid year format
      });

      await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
      const errors = validationResult(req);

      expect(errors.isEmpty()).to.be.false;
    });

    it('should trim whitespace from date fields', async () => {
      const schema = validatePerson();
      const req = createMockRequest({
        'dateOfBirth-day': '  15  ',
        'dateOfBirth-month': '  6  ',
        'dateOfBirth-year': '  1990  '
      });

      await Promise.all(schema.map((validation: ValidationChain) => validation.run(req as Request)));
      const errors = validationResult(req);

      expect(errors.isEmpty()).to.be.true;
    });
  });
});