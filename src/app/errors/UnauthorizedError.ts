/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { ApplicationError } from "#/app/errors/ApplicationError.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

export class UnauthorizedError extends ApplicationError {
  constructor() {
    super("User is not authenticated");
    this.name = "UnauthorizedError";
    this.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }
}
