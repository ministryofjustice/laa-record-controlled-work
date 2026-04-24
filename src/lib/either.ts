type ErrorClass<Err> = new (cause: unknown) => Err;

export interface Failure<Err> {
  readonly error: Err;
}
export interface Success<Value> {
  readonly error?: undefined; // enables narrowing
  readonly value: Value;
}
export type Either<Err, Value> = Failure<Err> | Success<Value>;

/**
 * Returns an `Either` failure outcome with a descriptive error
 * @param ErrorClass the Domain Error Class to be instantiated
 * @param cause the underlying error, passed to the domain error constructor
 * @returns `{ error: ErrorClass }`
 */
export function failure<Err, Value>(
  ErrorClass: ErrorClass<Err>,
  cause?: unknown,
): Either<Err, Value> {
  return { error: new ErrorClass(cause) };
}

/**
 * Returns an `Either` success outcome with a value
 * @param value the value to return
 * @returns `{ value: Value }`
 */
export function success<Err, Value>(value: Value): Either<Err, Value> {
  return { value };
}
