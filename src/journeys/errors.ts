/* eslint-disable jsdoc/require-jsdoc -- not needed */

export class UndefinedAnswerError extends Error {
  constructor(key: string) {
    super(`No answer value found for key "${key}"`);
    this.name = "UndefinedAnswerError";
  }
}

export class UndefinedParamError extends Error {
  constructor(key: string) {
    super(`No URL param value found for key "${key}"`);
    this.name = "UndefinedParamError";
  }
}

export class UndefinedSessionError extends Error {
  constructor() {
    super("Session is undefined");
    this.name = "UndefinedSessionError";
  }
}
