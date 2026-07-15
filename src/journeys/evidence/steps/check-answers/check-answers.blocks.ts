import {
  and,
  Answer,
  Condition,
  match,
  or,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import { NunjucksGenerators } from "@ministryofjustice/hmpps-forge/express-nunjucks";
import {
  GovUKHeading,
  GovUKSummaryList,
} from "@ministryofjustice/hmpps-forge/govuk-components";

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
    moreDetailsForNoEvidence: Answer("moreDetailsForNoEvidence"),
    reasonForNoEvidence: reasonForNoEvidenceLabel,
  },
  template: `
    {{ reasonForNoEvidence }}.<br />
    {% if moreDetailsForNoEvidence %}{{ moreDetailsForNoEvidence }}{% endif %}
  `,
});

const evidenceOfIncomeList = NunjucksGenerators.String({
  data: {
    asylumSupportEvidence: Answer("asylumSupportEvidence"),
    benefitsInKindEvidence: Answer("benefitsInKindEvidence"),
    employedEvidence: Answer("employedEvidence"),
    otherEvidence: Answer("otherEvidence"),
    selfEmployedEvidence: Answer("selfEmployedEvidence"),
    stateBenefitsEvidence: Answer("stateBenefitsEvidence"),
    taxCreditsEvidence: Answer("taxCreditsEvidence"),
    evidenceHeadings: {
      asylumSupportEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.asylumSupport",
      ),
      benefitsInKindEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.benefitsInKind",
      ),
      employedEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.employedPAYE",
      ),
      otherEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.otherIncome",
      ),
      selfEmployedEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.selfEmployed",
      ),
      stateBenefitsEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.stateBenefits",
      ),
      taxCreditsEvidenceLabel: t(
        "journeys.evidence.evidenceOfIncome.groupsOfEvidence.taxCredits",
      ),
    },
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
  },
  template: `
    {% if employedEvidence.length > 0 %}
    <strong>{{ evidenceHeadings.employedEvidenceLabel }}:</strong><br />
    {% for item in employedEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}{% endif %}
    {% if selfEmployedEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.selfEmployedEvidenceLabel }}:</strong><br />
    {% for item in selfEmployedEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if benefitsInKindEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.benefitsInKindEvidenceLabel }}:</strong><br />
    {% for item in benefitsInKindEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if otherEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.otherEvidenceLabel }}:</strong><br />
    {% for item in otherEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if stateBenefitsEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.stateBenefitsEvidenceLabel }}:</strong><br />
    {% for item in stateBenefitsEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if asylumSupportEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.asylumSupportEvidenceLabel }}:</strong><br />
    {% for item in asylumSupportEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if taxCreditsEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.taxCreditsEvidenceLabel }}:</strong><br />
    {% for item in taxCreditsEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
  `,
});

const evidenceOfExpenditureList = NunjucksGenerators.String({
  data: {
    employedEvidence: Answer("employedEvidence"),
    housingCostsEvidence: Answer("housingCostsEvidence"),
    childCareEvidence: Answer("childCareEvidence"),
    maintenanceEvidence: Answer("maintenanceEvidence"),
    evidenceHeadings: {
      employedEvidence: t(
        "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.incomeTaxAndNationalInsurance",
      ),
      housingCostsEvidence: t(
        "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.housingCosts",
      ),
      childCareEvidence: t(
        "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.childCare",
      ),
      maintenanceEvidence: t(
        "journeys.evidence.evidenceOfExpenditure.groupsOfEvidence.maintenance",
      ),
    },
    evidenceTypeLabels: {
      bankStatementsHousing: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsHousing",
      ),
      mortgageStatement: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.mortgageStatement",
      ),
      rentStatement: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.rentStatement",
      ),
      wageSlips: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.wageSlips",
      ),
      taxCalculationSheet: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.taxCalculationSheet",
      ),
      bankStatementsChildCare: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsChildCare",
      ),
      agreementOrContract: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.agreementOrContract",
      ),
      bankStatementsMaintenance: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.bankStatementsMaintenance",
      ),
      maintenanceOrder: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.maintenanceOrder",
      ),
      receipts: t(
        "journeys.evidence.evidenceOfExpenditure.evidenceTypes.receipts",
      ),
    },
  },
  template: `
    {% if employedEvidence.length > 0 %}
    <strong>{{ evidenceHeadings.employedEvidence }}:</strong><br />
    {% for item in employedEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}{% endif %}
    {% if housingCostsEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.housingCostsEvidence }}:</strong><br />
    {% for item in housingCostsEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if childCareEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.childCareEvidence }}:</strong><br />
    {% for item in childCareEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
    {% endif %}
    {% if maintenanceEvidence.length > 0 %}
    <br /><strong>{{ evidenceHeadings.maintenanceEvidence }}:</strong><br />
    {% for item in maintenanceEvidence %}{{ evidenceTypeLabels[item] }},<br />{% endfor %}
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
      value: { html: mergedReasonForNoEvidenceLabel },
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("no")),
    },
    {
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
      visibleWhen: Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
    },
    {
      actions: {
        items: [
          {
            href: "/cases/evidence/evidence-of-expenditure?returnTo=check-answers",
            text: t("journeys.evidence.checkAnswers.changeLink.change"),
            visuallyHiddenText: t(
              "journeys.evidence.checkAnswers.answerLabels.evidenceOfExpenditure",
            ),
          },
        ],
      },
      key: {
        text: t(
          "journeys.evidence.checkAnswers.answerLabels.evidenceOfExpenditure",
        ),
      },
      value: { html: evidenceOfExpenditureList },
      visibleWhen: and(
        Answer("doYouHaveEvidence").match(Condition.Equals("yes")),
        or(
          Answer("employedEvidence").match(
            Condition.Array.IsArray(Answer("employedEvidence")),
          ),
          Answer("housingCostsEvidence").match(
            Condition.Array.IsArray(Answer("housingCostsEvidence")),
          ),
          Answer("childCareEvidence").match(
            Condition.Array.IsArray(Answer("childCareEvidence")),
          ),
          Answer("maintenanceEvidence").match(
            Condition.Array.IsArray(Answer("maintenanceEvidence")),
          ),
        ),
      ),
    },
  ],
});
