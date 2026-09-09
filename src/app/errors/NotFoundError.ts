/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { ApplicationError } from "#/app/errors/ApplicationError.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

export class NotFoundError extends ApplicationError {
  constructor() {
    super("Resource not found");
    this.name = "NotFoundError";
    this.statusCode = HTTP_STATUS.NOT_FOUND;
  }
}
