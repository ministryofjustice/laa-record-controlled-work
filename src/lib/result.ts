/**
 * Functional error handling using the Either pattern.
 *
 * Either<E, A> represents a value that is one of two things:
 *   - Failure<E> — something went wrong, holds the error (type E)
 *   - Success<A> — everything worked, holds the result (type A)
 *
 * Usage:
 *   async function doThing(): Promise<Either<MyError, string>> {
 *     if (bad) return failure({ type: 'SomethingWentWrong' });
 *     return success('the value');
 *   }
 *
 *   const result = await doThing();
 *   if (result.isFailure()) {
 *     // result.value is MyError here
 *   } else {
 *     // result.value is string here
 *   }
 */

/**
 * Represents a failed outcome. Holds the error value E.
 *
 * Both type parameters must be declared here so TypeScript can narrow
 * correctly when switching between Failure and Success within Either<E, A>.
 */
export class Failure<E, A> {
  readonly value: E;

  /**
   * Creates a Failure wrapping the given error value.
   * @param {E} value - The error value to wrap.
   */
  constructor(value: E) {
    this.value = value;
  }

  /**
   * Always true on Failure — narrows the type to Failure<E, A> so TypeScript
   * knows result.value is E (the error type) inside the if block.
   * "this is Failure<E, A>" is a type predicate: it tells TypeScript what type
   * this is when the method returns true.
   * @returns {boolean} Always true.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- type predicate references `this` in the return type, not the body
  isFailure(): this is Failure<E, A> {
    return true;
  }

  /**
   * Always false on Failure — TypeScript uses this to rule out the Success
   * branch when isFailure() has already returned true.
   * @returns {boolean} Always false.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- type predicate references `this` in the return type, not the body
  isSuccess(): this is Success<E, A> {
    return false;
  }
}

/**
 * Represents a successful outcome. Holds the success value A.
 */
export class Success<E, A> {
  readonly value: A;

  /**
   * Creates a Success wrapping the given value.
   * @param {A} value - The success value to wrap.
   */
  constructor(value: A) {
    this.value = value;
  }

  /**
   * Always false on Success — mirrors Failure.isFailure() so the union type works.
   * @returns {boolean} Always false.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- type predicate references `this` in the return type, not the body
  isFailure(): this is Failure<E, A> {
    return false;
  }

  /**
   * Always true on Success — narrows result.value to A (the success type).
   * @returns {boolean} Always true.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this -- type predicate references `this` in the return type, not the body
  isSuccess(): this is Success<E, A> {
    return true;
  }
}

/** A value that is either a Failure<E> or a Success<A>. */
export type Either<E, A> = Failure<E, A> | Success<E, A>;

/**
 * Wraps an error value in a Failure.
 * @param {E} e - The error value.
 * @returns {Either<E, A>} A Failure containing the error.
 */
export function failure<E, A>(e: E): Either<E, A> {
  return new Failure(e);
}

/**
 * Wraps a success value in a Success.
 * @param {A} a - The success value.
 * @returns {Either<E, A>} A Success containing the value.
 */
export function success<E, A>(a: A): Either<E, A> {
  return new Success(a);
}
