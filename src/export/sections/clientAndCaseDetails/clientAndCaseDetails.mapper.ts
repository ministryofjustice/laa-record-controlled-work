import type { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { PriorLegalAid } from "#/api/dto/application/application.dto.js";
import type {
  ClientAndCaseDetailsSection,
  ClientAndCaseDetailsSummaryRow,
} from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";

import { parseScopingQuestions } from "#/api/dto/application/application.dto.js";
import {
  formatClientAddress,
  formatDateOfBirth,
  normaliseOptionalText,
} from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.formatter.js";
import { fixedT, t } from "#/lib/i18n.js";

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
  const address = formatClientAddress(application.clientDetails);
  const niNumber = normaliseOptionalText(application.clientDetails.niNumber);
  const clientDetailsT = fixedT("pages.export.clientAndCaseDetails");
  const rows: ClientAndCaseDetailsSummaryRow[] = [
    {
      key: { text: clientDetailsT("ecf") },
      value: { text: t("common.no") },
    },
    {
      key: { text: clientDetailsT("typeOfFamilyLaw") },
      value: { text: "" },
    },
    {
      key: { text: clientDetailsT("transitionalEuArrangements") },
      value: { text: "" },
    },
    {
      key: { text: clientDetailsT("protectThemselfOrChildren") },
      value: { text: "" },
    },
    {
      key: { text: clientDetailsT("evidenceCaseIsInScope") },
      value: { text: "" },
    },
    {
      key: { text: clientDetailsT("confirmMerits") },
      value: { text: "" },
    },
    {
      key: { text: clientDetailsT("accessedLegalAidBefore") },
      value: { text: mapAccessedLegalAidBefore(priorLegalAid) },
    },
    ...mapSameMatterRows(priorLegalAid, reasonForReapplication),
    {
      key: { text: clientDetailsT("firstName") },
      value: { text: application.clientDetails.firstName.trim() },
    },
    {
      key: { text: clientDetailsT("lastName") },
      value: { text: application.clientDetails.lastName.trim() },
    },
    {
      key: { text: clientDetailsT("dateOfBirth") },
      value: { text: formatDateOfBirth(application.clientDetails.dateOfBirth) },
    },
    {
      key: { text: clientDetailsT("niNumber") },
      value: { text: niNumber ?? "" },
    },
    {
      key: { text: clientDetailsT("address") },
      value:
        address === null
          ? { text: clientDetailsT("noFixedAddress") }
          : { html: address.map(escapeHtml).join("<br>") },
    },
  ];

  return {
    heading: clientDetailsT("heading"),
    rows,
  };
}

/**
 * Escapes an address line for use in summary-list HTML.
 * @param value Address text from application data.
 * @returns HTML-escaped address text.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/**
 * Maps the prior legal aid answer to its export display value.
 * @param priorLegalAid Recognised prior legal aid answer.
 * @returns The translated answer, or an empty string when no answer exists.
 */
function mapAccessedLegalAidBefore(
  priorLegalAid: PriorLegalAid | undefined,
): string {
  if (priorLegalAid === undefined) {
    return "";
  }

  return priorLegalAid === "no" ? t("common.no") : t("common.yes");
}

/**
 * Maps same-matter application details to summary rows.
 * @param priorLegalAid The applicant's prior legal aid answer.
 * @param reasonForReapplication The normalised reapplication reason, if provided.
 * @returns Same-matter rows, or an empty array when this is not a same-matter application.
 */
function mapSameMatterRows(
  priorLegalAid: PriorLegalAid | undefined,
  reasonForReapplication: null | string,
): ClientAndCaseDetailsSummaryRow[] {
  const clientDetailsT = fixedT("pages.export.clientAndCaseDetails");

  if (priorLegalAid !== "yesSameMatter") {
    return [];
  }

  return [
    {
      key: { text: clientDetailsT("sameMatterWithin6Months") },
      value: {
        text: reasonForReapplication ? t("common.yes") : t("common.no"),
      },
    },
    ...(reasonForReapplication
      ? [
          {
            key: { text: clientDetailsT("reasonForReapplication") },
            value: { text: reasonForReapplication },
          },
        ]
      : []),
  ];
}
