/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { ApplicationError } from "#/app/errors/ApplicationError.js";

export class NotFoundError extends ApplicationError {
  constructor() {
    super("Resource not found");
    this.name = "NotFoundError";
    this.statusCode = HTTP_STATUS.NOT_FOUND;
  }
}
