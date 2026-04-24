export interface Failure<Err> {
  readonly error: Err;
  readonly value?: never;
}
export interface Success<Value> {
  readonly error?: never;
  readonly value: Value;
}
export type Either<Err, Value> = Failure<Err> | Success<Value>;

/**
 * .
 * @param error .
 * @returns .
 */
export function failure<Err, Value>(error: Err): Either<Err, Value> {
  return { error };
}

/**
 * Returns an `Either` success outcome with a value
 * @param value the value to return
 * @returns `{ value: Value }`
 */
export function success<Err, Value>(value: Value): Either<Err, Value> {
  return { value };
}
