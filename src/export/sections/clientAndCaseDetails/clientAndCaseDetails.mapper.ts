import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { PriorLegalAid } from "#/api/dto/application/application.dto.js";
import type { ClientAndCaseDetailsSection } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";

import { parseScopingQuestions } from "#/api/dto/application/application.dto.js";
import {
  formatClientAddress,
  formatDateOfBirth,
  normaliseOptionalText,
} from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.formatter.js";

/**
 * Maps an application to the client and case details export section.
 * @param application Validated application returned by the RCW API.
 * @returns Client and case details ready for export view rendering.
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
    sameMatterDetails: mapSameMatterDetails(
      priorLegalAid,
      reasonForReapplication,
    ),
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

/**
 * Maps same-matter details when the application is a reapplication for the same matter.
 * @param priorLegalAid The applicant's previous legal aid answer.
 * @param reasonForReapplication A normalised reapplication reason, when provided.
 * @returns Same-matter details, or null when the application is not for the same matter.
 */
function mapSameMatterDetails(
  priorLegalAid: PriorLegalAid | undefined,
  reasonForReapplication: null | string,
): ClientAndCaseDetailsSection["sameMatterDetails"] {
  if (priorLegalAid !== "yesSameMatter") {
    return null;
  }

  return {
    reasonForReapplication,
    sameMatterWithin6Months: reasonForReapplication !== null,
  };
}
