/* eslint-disable jsdoc/require-jsdoc -- Not required */

export class ApplicationError extends Error {
  constructor(message: string) {
    super();
    this.name = "ApplicationError";
  }
}
