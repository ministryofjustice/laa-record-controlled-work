/**
 * Abstract domain error utility class, enables clean, idiomatic error instantiation
 * from typed subclasses using Subclass.from(cause)
 *
 * Also provides toJSON for easy serialisation where required.
 */
export abstract class DomainError extends Error {
  // bundler can minify class names, enforce setting it explicitly
  // for scenarios where name matters, like lookups for status codes
  public abstract readonly name: string;

  /**
   * Abstract constructor, calls Error constructor with message and cause,
   * sets the object prototype to the extending class's prototype
   * @param message error message
   * @param cause root cause (usually type `Error`)
   */
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    // Restores the prototype chain so `instanceof` checks work correctly
    // for classes which extend DomainError.
    // "new" exists in the context of the extending class's constructor.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Creates an instance of the Subclass with specified cause
   * @param cause the specified cause
   * @returns Subclass instance
   */
  static from<Subclass extends DomainError>(
    this: new (cause?: unknown) => Subclass,
    cause?: unknown,
  ): Subclass {
    // "this" in a static function would normally point at the DomainError class,
    // we redefine it using a constructor signature to reference the generic Subclass
    return new this(cause);
  }

  /**
   * Errors and JSON don't mix.
   * This forces native, non-enumerable properties to be serialized.
   * Express `res.json()` and `JSON.stringify()` will automatically use this.
   * @returns json serialised error
   */
  toJSON(): Record<string, unknown> {
    const json = {
      name: this.name,
      message: this.message,
      // stack: this.stack, // omitted for now
      cause: this.cause,
    };

    if (this.cause instanceof DomainError) {
      json.cause = this.cause.toJSON();
    } else if (this.cause instanceof Error) {
      const { name, message } = this.cause;
      json.cause = { name, message };
    }

    return json;
  }
}
