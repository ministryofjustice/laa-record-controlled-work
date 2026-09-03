/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { ApplicationError } from "#/app/errors/ApplicationError.js";

export class UnauthorizedError extends ApplicationError {
  constructor() {
    super("User is not authenticated");
    this.name = "UnauthorizedError";
    this.statusCode = HTTP_STATUS.UNAUTHORIZED;
  }
}
