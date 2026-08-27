/* eslint-disable jsdoc/require-jsdoc -- Not required */

import { HTTP_STATUS } from "#/app/enums/httpStatus.enum.js";

export class ApplicationError extends Error {
  statusCode?: HTTP_STATUS;

  constructor(message: string) {
    super();
    this.name = "ApplicationError";
    this.statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }
}
