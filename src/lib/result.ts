/**
 * Functional error handling using the Either pattern.
 *
 * Either<E, A> represents a value that is one of two things:
 *   - Failure<E> — something went wrong, holds the error (type E)
 *   - Success<A> — everything worked, holds the result (type A)
 
/**
 * Represents a failed outcome. Holds the error value E.
 *
 * Both type parameters must be declared here so TypeScript can narrow
 * correctly when switching between Failure and Success within Either<E, A>.
 */
export class Failure<E, A> {
  readonly value: E;

  /**
   *
   * @param value
   */
  constructor(value: E) {
    this.value = value;
  }

  // Always true on Failure — calling this narrows the type to Failure<E, A>,
  // which tells TypeScript that result.value is E (the error type).
  // "this is Failure<E, A>"" is called a type predicate and says "if this method returns true, treat this as a Failure".
  /**
   *
   */
  isFailure(): this is Failure<E, A> {
    return true;
  }

  // Always false on Failure — calling this would narrow to Success<E, A>,
  // which TypeScript uses to rule out this branch.
  // "this is Success<E, A>"" is called a type predicate and says "if this method returns true, treat this as a Success".

  /**
   *
   */
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
   *
   * @param value
   */
  constructor(value: A) {
    this.value = value;
  }

  /**
   *
   */
  isFailure(): this is Failure<E, A> {
    return false;
  }

  /**
   *
   */
  isSuccess(): this is Success<E, A> {
    return true;
  }
}

/** A value that is either a Failure<E> or a Success<A>. */
export type Either<E, A> = Failure<E, A> | Success<E, A>;

/**
 * Wraps an error value in a Failure.
 * @param e
 */
export function failure<E, A>(e: E): Either<E, A> {
  return new Failure(e);
}

/**
 * Wraps a success value in a Success.
 * @param a
 */
export function success<E, A>(a: A): Either<E, A> {
  return new Success(a);
}
