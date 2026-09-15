import type { EffectFunctionContext } from "@ministryofjustice/hmpps-forge/core";

import type { createApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import type { JourneySession } from "#/journeys/context.type.js";
import type { CONTEXT_DATA_KEYS } from "#/journeys/journey.constants.js";

export interface CreateApplicationAnswers extends Record<string, unknown> {
  [AnswerKey.dateOfBirth]?: string;
  [AnswerKey.ecf]?: string;
  [AnswerKey.firstName]?: string;
  [AnswerKey.hasNINumber]?: string;
  [AnswerKey.haveAHomeAddress]?: string;
  [AnswerKey.lastName]?: string;
  [AnswerKey.legalAidBefore]?: string;
  [AnswerKey.legalAidLast6Months]?: string;
  [AnswerKey.niNumber]?: string;
  [AnswerKey.osAddressLine1]?: string;
  [AnswerKey.osAddressLine2]?: string;
  [AnswerKey.osAddressLine3]?: string;
  [AnswerKey.osAddressLine4]?: string;
  [AnswerKey.osCountry]?: string;
  [AnswerKey.reasonForYes]?: string;
  [AnswerKey.ukAddressLine1]?: string;
  [AnswerKey.ukAddressLine2]?: string;
  [AnswerKey.ukCountry]?: string;
  [AnswerKey.ukCounty]?: string;
  [AnswerKey.ukPostcode]?: string;
  [AnswerKey.ukTownOrCity]?: string;
}

export type CreateApplicationContext = EffectFunctionContext<
  CreateApplicationData,
  CreateApplicationAnswers,
  JourneySession
>;

export interface CreateApplicationData extends Record<string, unknown> {
  [CONTEXT_DATA_KEYS.applicationID]: string;
}

export interface CreateApplicationEffectsDeps {
  createApplication: typeof createApplication;
}
