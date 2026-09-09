/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { ApplicationError } from "#/app/errors/ApplicationError.js";
import { HTTP_STATUS } from "#/lib/constants/http.js";

export class ForbiddenError extends ApplicationError {
  constructor() {
    super("User is not authorized to access this resource");
    this.name = "ForbiddenError";
    this.statusCode = HTTP_STATUS.FORBIDDEN;
  }
}
