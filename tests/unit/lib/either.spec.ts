import { Either, failure, Success, success } from '#src/lib/either.js';
import { DomainError } from '#src/lib/errors/domainError.js';
import { expect } from 'chai';




describe('Either Monad', () => {
  describe('success()', () => {
    it('should return a Success object containing the provided value', () => {
      const value = { id: 1, name: 'Alice' };
      
      const result = success(value);
      
      expect(result.error).to.be.undefined;
      expect(result.value).to.equal(value);
      expect(result).to.deep.equal({ value: value });
    });

    it('should handle falsy success values (like 0, false, or "")', () => {
      const result = success(0);

      expect(result.error).to.be.undefined;
      expect(result).to.deep.equal({ value: 0 });
    });
  });

  describe('failure()', () => {
    it('should return a Failure object containing a native Error', () => {
      const nativeError = new TypeError('Invalid input type');
      
      const result = failure(nativeError);

      expect(result.value).to.be.undefined;
      expect(result.error).to.equal(nativeError);
      expect(result).to.deep.equal({ error: nativeError });
    });

    it('should work seamlessly with the DomainError.from() factory pattern', () => {
      class TestDomainError extends DomainError {
        public override readonly name = "TestDomainError";
        constructor(cause?: unknown) {
          super("Mock database connection failed", cause);
        }
      }

      const rootCause = new Error('TEST_ERROR');
      const domainError = TestDomainError.from(rootCause);

      const result = failure(domainError);
      if (!result.error) throw new Error("result.error is undefined")

      expect(result.error).to.be.instanceOf(TestDomainError);
      expect(result.error.name).to.equal('TestDomainError');
      expect(result.error.cause).to.equal(rootCause);
    });
  });

  describe('Narrowing for control flow', () => {
    const eitherOperation = (status: "success" | "failure"): Either<Error, string> => {
      return status === "success"
        ? success("Operation complete")
        : failure(new Error('Operation failed'));
    };

    it('should allow narrowing to the Success value when !result.error is true', () => {
      const result = eitherOperation("success");

      if (result.error) throw new Error('Test failed: Should have narrowed to Success');

      expect(result.value).to.equal('Operation complete');
    });

    it('should allow narrowing to the Failure error when result.error is truthy', () => {
      const result = eitherOperation("failure");

      if (result.error) {
        expect(result.error.message).to.equal('Operation failed');
      } else {
        throw new Error('Test failed: Should have narrowed to Failure');
      }
    });
  });
});