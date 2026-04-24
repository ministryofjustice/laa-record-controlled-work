/**
 * Domain Error introduces a create factory function for typed domain errors
 */
export abstract class DomainError extends Error {
  /**
   * Abstract constructor, sets Error.name to subclass name and
   * sets the object prototype to the extending class's prototype
   * @param message error message
   * @param cause root cause (usually type `Error`)
   */
  constructor(message: string, cause: unknown) {
    super(message, { cause });

    // Sets the Error.name to the extending class's name
    this.name = this.constructor.name;

    // Restores the prototype chain so `instanceof` checks work correctly
    // for classes which extend DomainError.
    // "new" exists in the context of the extending class's constructor.
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Creates an instance of the SubclassError calling the function
   * @param args -
   * @returns -
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- required
  static create<Subclass extends DomainError, SubclassArgs extends any[]>(
    this: new (...args: SubclassArgs) => Subclass,
    ...args: SubclassArgs
  ): Subclass {
    // "this" normally points at the DomainError class
    // redefine it to point at the generic Subclass calling the function
    return new this(...args);
  }
}
