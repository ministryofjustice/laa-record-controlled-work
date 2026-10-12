import { z } from "zod";

import type { Eligibility } from "#/api/clients/rcw/model/eligibility.zod.gen.js";
import type { EligibilityData } from "#/api/clients/rcw/model/eligibilityData.zod.gen.js";
import type {
  getApplication,
  updateApplicationMeans,
} from "#/api/clients/rcw/schema/applications/applications.gen.js";

export interface EligibilityAssessment {
  data: EligibilityData;
  result?: Eligibility["result"];
}

export interface LoadEligibilityAssessmentDeps {
  getApplication: typeof getApplication;
}

export interface LoadEligibilityAssessmentParams {
  applicationId: string;
  correlationId?: string;
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}

export const PutEligibilityRequestBody = z.object({
  eligibility_assessment: z.looseObject({}),
});

export enum ClientAgeRange {
  Over60 = "over_60",
  Standard = "standard",
  Under18 = "under_18",
}

export type PutEligibilityRequestBody = z.infer<
  typeof PutEligibilityRequestBody
>;

export interface SaveEligibilityAssessmentDeps {
  updateApplicationMeans: typeof updateApplicationMeans;
}

export interface SaveEligibilityAssessmentParams {
  applicationId: string;
  correlationId?: string;
  eligibilityAssessment: EligibilityData;
  homeAccountId: string | undefined;
  sessionId: string | undefined;
}
