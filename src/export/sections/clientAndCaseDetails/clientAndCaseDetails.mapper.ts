import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { PriorLegalAid } from "#/api/dto/application/scopingQuestions.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";

import { parseScopingQuestions } from "#/api/dto/application/scopingQuestions.js";
import {
  formatClientAddress,
  formatDateOfBirth,
  normaliseOptionalText,
} from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.formatter.js";

/**
 * Maps an application to the client and case details export section.
 * @param application Validated application returned by the RCW API.
 * @returns Client and case details ready for view rendering.
 */
export function toClientAndCaseDetailsSection(
  application: Application,
): ClientAndCaseDetailsSection {
  const { priorLegalAid } = parseScopingQuestions(application.scopingQuestions);
  const reasonForReapplication = normaliseOptionalText(
    application.reasonForReapplication,
  );

  return {
    accessedLegalAidBefore: mapAccessedLegalAidBefore(priorLegalAid),
    address: formatClientAddress(application.clientDetails),
    confirmMerits: null,
    dateOfBirth: formatDateOfBirth(application.clientDetails.dateOfBirth),
    ecf: false,
    evidenceCaseIsInScope: null,
    firstName: application.clientDetails.firstName.trim(),
    lastName: application.clientDetails.lastName.trim(),
    niNumber: normaliseOptionalText(application.clientDetails.niNumber),
    protectThemselfOrChildren: null,
    sameMatterDetails:
      priorLegalAid === "yesSameMatter"
        ? {
            reasonForReapplication,
            sameMatterWithin6Months: reasonForReapplication !== null,
          }
        : null,
    transitionalEuArrangements: null,
    typeOfFamilyLaw: null,
  };
}

/**
 * Maps the prior legal aid answer to its export display value.
 * @param priorLegalAid Recognised prior legal aid answer.
 * @returns Yes, no, or null when no recognised answer exists.
 */
function mapAccessedLegalAidBefore(
  priorLegalAid: PriorLegalAid | undefined,
): boolean | null {
  if (priorLegalAid === "no") {
    return false;
  }

  return priorLegalAid === undefined ? null : true;
}
