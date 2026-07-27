import {
  Condition,
  Self,
  validation,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBody,
  GovUKCheckboxInput,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const heading = GovUKHeading({
  level: H1,
  text: t("journeys.evidence.evidenceOfCapital.title"),
});

export const label = GovUKBody({
  classes: "govuk-hint",
  text: t("journeys.evidence.evidenceOfCapital.hint"),
});

export const capitalEvidenceGroup = GovUKCheckboxInput({
  code: "capitalEvidence",
  items: [
    {
      text: t(
        "journeys.evidence.evidenceOfCapital.evidenceTypes.bankStatementCapital",
      ),
      value: "bankStatementCapital",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfCapital.evidenceTypes.savingsCertificatePassbook",
      ),
      value: "savingsCertificatePassbook",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfCapital.evidenceTypes.premiumBondsStatement",
      ),
      value: "premiumBondsStatement",
    },
    {
      text: t(
        "journeys.evidence.evidenceOfCapital.evidenceTypes.shareCertificate",
      ),
      value: "shareCertificate",
    },
  ],
  validWhen: [
    validation({
      condition: Self().match(Condition.IsRequired()),
      message: t("journeys.evidence.evidenceOfCapital.validation.required"),
    }),
  ],
});
