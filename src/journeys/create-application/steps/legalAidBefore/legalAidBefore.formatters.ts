import {
  CreateApplicationPath,
  JourneyPath,
} from "#/journeys/JourneyPath.enum.js";
import { t } from "#/lib/i18n.js";

export const ecfPath =
  JourneyPath.CREATE_APPLICATION + CreateApplicationPath.ECF;

export const legalAidBeforeCaption = t("journeys.createApplication.caption");

export const legalAidBeforeTitle = t(
  "journeys.createApplication.legalAidBefore.title",
);

export const sameMatter = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesSameMatter",
);
export const differentMatter = t(
  "journeys.createApplication.legalAidBefore.radioButton.yesDifferentMatter",
);

export const legalAidBeforeValidation = t(
  "journeys.createApplication.legalAidBefore.validation.required",
);
