import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { ExportApplicationViewModel } from "#/export/export.types.js";

import { toClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.mapper.js";
import { toMeansAssessmentSection } from "#/export/sections/meansAssessment/meansAssessment.mapper.js";

/**
 * Maps an authorised application to the fields exposed by the export view.
 * @param application - The validated application returned by the RCW API.
 * @returns The export view model.
 */
export function toExportApplicationViewModel(
  application: Application,
): ExportApplicationViewModel {
  const clientName = [
    application.clientDetails.firstName.trim(),
    application.clientDetails.lastName.trim(),
  ]
    .filter(Boolean)
    .join(" ");
  const applicationRefNumber = application.applicationRefNumber?.trim() ?? "";

  return {
    applicationRefNumber: applicationRefNumber || null,
    clientAndCaseDetails: toClientAndCaseDetailsSection(application),
    clientName: clientName || null,
    meansAssessment: toMeansAssessmentSection(application),
  };
}
