import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { getApplication } from "#/api/clients/rcw/schema/applications/applications.gen.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";

export type ExportApplication = Application;

export interface ExportApplicationViewModel {
  applicationRefNumber: null | string;
  clientAndCaseDetails: ClientAndCaseDetailsSection;
  clientName: null | string;
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
