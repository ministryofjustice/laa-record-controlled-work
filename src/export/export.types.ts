import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";
import type { MeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.types.js";


export interface ExportApplicationViewModel {
  applicationRefNumber: null | string;
  clientAndCaseDetails: ClientAndCaseDetailsSection;
  clientName: null | string;
  meansAssessment: MeansAssessmentSection | null;
}

export interface LoadApplicationForExportDeps {
  getApplication: typeof getApplication;
}

export interface LoadApplicationForExportParams {
  applicationId: string;
  homeAccountId: string | undefined;
  selectedOfficeCode: string | undefined;
  sessionId: string | undefined;
}
