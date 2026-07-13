import {
  Answer,
  Condition,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import {
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";
import { match } from "@ministryofjustice/hmpps-forge/core/authoring";
import { t } from "#/lib/i18n.js";

const doYouHaveEvidenceLabel = match(Answer("doYouHaveEvidence"))
  .branch(Condition.Equals("yes"), t("common.yes"))
  .otherwise(t("common.no"));

const reasonForNoEvidenceLabel = match(Answer("reasonForNoEvidence"))
  .branch(
    Condition.Equals("notPossibleBeforeStart"),
    t("journeys.evidence.reasonForNoEvidence.options.notPossibleBeforeStart"),
  )
  .branch(
    Condition.Equals("adviceOverPhone"),
    t("journeys.evidence.reasonForNoEvidence.options.adviceOverPhone"),
  )
  .branch(
    Condition.Equals("personalCircumstances"),
    t("journeys.evidence.reasonForNoEvidence.options.personalCircumstances"),
  );

const mergedReasonForNoEvidenceLabel = NunjucksGenerators.String({
  data: {
    reasonForNoEvidence: reasonForNoEvidenceLabel,
    moreDetailsForNoEvidence: Answer("moreDetailsForNoEvidence"),
  },
  template: `
    {{ reasonForNoEvidence }}.
    {% if moreDetailsForNoEvidence %}{{ moreDetailsForNoEvidence }}{% endif %}
  `,
});

const evidenceOfIncomeList = NunjucksGenerators.String({
  data: {
    evidenceTypeLabels: {
      asylumSupportLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.asylumSupportLetter",
      ),
      bankStatements: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.bankStatements",
      ),
      cashBook: t("journeys.evidence.evidenceOfIncome.evidenceTypes.cashBook"),
      completeFinancialAccounts: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.completeFinancialAccounts",
      ),
      evidenceOfRentalIncome: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.evidenceOfRentalIncome",
      ),
      evidenceOfTrustIncome: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.evidenceOfTrustIncome",
      ),
      latestBenefitChangeLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.latestBenefitChangeLetter",
      ),
      latestTaxCreditAwardNotice: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.latestTaxCreditAwardNotice",
      ),
      letterFromFriendOrFamily: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.letterFromFriendOrFamily",
      ),
      originalNotificationLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.originalNotificationLetter",
      ),
      other: t("journeys.evidence.evidenceOfIncome.evidenceTypes.other"),
      otherRecentHMRCLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.otherRecentHMRCLetter",
      ),
      p11dTaxForm: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.p11dTaxForm",
      ),
      passportingBenefitLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.passportingBenefitLetter",
      ),
      pensionDocuments: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.pensionDocuments",
      ),
      selfAssessmentTaxReturn: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.selfAssessmentTaxReturn",
      ),
      studentLoanLetter: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.studentLoanLetter",
      ),
      wageSlips: t(
        "journeys.evidence.evidenceOfIncome.evidenceTypes.wageSlips",
      ),
    },
    employedEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.employedPAYE",
    ),
    employedEvidence: Answer("employedEvidence"),
    selfEmployedEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.selfEmployed",
    ),
    selfEmployedEvidence: Answer("selfEmployedEvidence"),
    benefitsInKindEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.benefitsInKind",
    ),
    benefitsInKindEvidence: Answer("benefitsInKindEvidence"),
    otherEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.otherIncome",
    ),
    otherEvidence: Answer("otherEvidence"),
    stateBenefitsEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.stateBenefits",
    ),
    stateBenefitsEvidence: Answer("stateBenefitsEvidence"),
    asylumSupportEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.asylumSupport",
    ),
    asylumSupportEvidence: Answer("asylumSupportEvidence"),
    taxCreditsEvidenceLabel: t(
      "journeys.evidence.evidenceOfIncome.groupsOfEvidence.taxCredits",
    ),
    taxCreditsEvidence: Answer("taxCreditsEvidence"),
  },
  template: `
    {% if employedEvidence.length > 0 %}
    <strong>{{ employedEvidenceLabel }}:</strong><br />
    {% for item in employedEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}{% endif %}
    {% if selfEmployedEvidence.length > 0 %}
    <br /><strong>{{ selfEmployedEvidenceLabel }}:</strong><br />
    {% for item in selfEmployedEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if benefitsInKindEvidence.length > 0 %}
    <br /><strong>{{ benefitsInKindEvidenceLabel }}:</strong><br />
    {% for item in benefitsInKindEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if otherEvidence.length > 0 %}
    <br /><strong>{{ otherEvidenceLabel }}:</strong><br />
    {% for item in otherEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if stateBenefitsEvidence.length > 0 %}
    <br /><strong>{{ stateBenefitsEvidenceLabel }}:</strong><br />
    {% for item in stateBenefitsEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if asylumSupportEvidence.length > 0 %}
    <br /><strong>{{ asylumSupportEvidenceLabel }}:</strong><br />
    {% for item in asylumSupportEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if taxCreditsEvidence.length > 0 %}
    <br /><strong>{{ taxCreditsEvidenceLabel }}:</strong><br />
    {% for item in taxCreditsEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
  `,
});

export const heading = GovUKHeading({
  text: t("journeys.evidence.checkAnswers.title"),
});

export const summaryList = GovUKSummaryList({
  rows: [
    {
      actions: {
        items: [
          {
            href: "/cases/evidence/have-evidence?returnTo=check-answers",
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.doYouHaveEvidence",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.doYouHaveEvidence",
        ),
      },
      value: { text: doYouHaveEvidenceLabel },
    },
    {
      actions: {
        items: [
          {
            href: "/cases/evidence/reason-for-no-evidence?returnTo=check-answers",
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.reasonForNoEvidence",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.reasonForNoEvidence",
        ),
      },
      value: { text: mergedReasonForNoEvidenceLabel },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("no")),
    },
    {
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
      actions: {
        items: [
          {
            href: "/cases/evidence/evidence-of-income?returnTo=check-answers",
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.evidenceOfIncome",
            ),
          },
        ],
      },
      key: {
        text: t("journeys.evidence.checkAnswers.answerLabels.evidenceOfIncome"),
      },
      value: { html: evidenceOfIncomeList },
    },
  ],
});
