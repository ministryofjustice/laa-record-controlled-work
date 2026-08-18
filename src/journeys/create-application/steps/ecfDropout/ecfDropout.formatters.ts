import { JourneyPath } from "#/journeys/JourneyPath.enum.js";
import { t } from "#/lib/i18n.js";

export const ecfPath = `${JourneyPath.CREATE_APPLICATION}/ecf`;

export const ecfDropoutHeading = t(
  "journeys.createApplication.ecfDropout.heading",
);

export const ecfDropoutTitle = t("journeys.createApplication.ecfDropout.title");

export const returnToCaseList = t(
  "journeys.createApplication.ecfDropout.button",
);
