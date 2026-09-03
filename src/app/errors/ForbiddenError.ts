/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";
import { ApplicationError } from "#/app/errors/ApplicationError.js";

export class ForbiddenError extends ApplicationError {
  constructor() {
    super("User is not authorized to access this resource");
    this.name = "ForbiddenError";
    this.statusCode = HTTP_STATUS.FORBIDDEN;
  }
}
