import {
  CreateApplicationPath,
  JourneyPath,
} from "#/journeys/JourneyPath.enum.js";
import { t } from "#/lib/i18n.js";

export const declarationPath =
  JourneyPath.CREATE_APPLICATION + CreateApplicationPath.DECLARATION;

export const ecfCaptionTitle = t("journeys.createApplication.caption");

export const ecfQuestion = t("journeys.createApplication.ecf.title");

export const ecfRequiredValidationMessage = t(
  "journeys.createApplication.ecf.validation.required",
);
