import type { AnswerSelection } from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

/** Selectors for the client fields saved by CCQ. */
export const client: AnswerSelection = {
  additionalProperties: (answers) => answers.additional_properties ?? [],
  additionalPropertyOwned: (answers) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed ownership answers.
    return answers.additional_property_owned!;
  },
  assets: {
    bankAccounts: (answers) => answers.bank_accounts,
    investments: {
      amount: (answers) => answers.investments,
      disputed: (answers) => answers.investments_in_dispute,
      relevant: (answers) => answers.investments_relevant,
    },
    valuables: {
      amount: (answers) => answers.valuables,
      disputed: (answers) => answers.valuables_in_dispute,
      relevant: (answers) => answers.valuables_relevant,
    },
  },
  benefits: (answers) => answers.benefits,
  employmentIncomes: (answers) => answers.incomes,
  employmentStatus: (answers) => answers.employment_status,
  isDisputeApplicable: (answers) => answers.immigration_or_asylum !== true,
  isPresent: () => true,
  otherIncome: {
    friendsOrFamily: {
      amount: (answers) => answers.friends_or_family_conditional_value,
      frequency: (answers) => answers.friends_or_family_frequency,
      relevant: (answers) => answers.friends_or_family_relevant,
    },
    maintenance: {
      amount: (answers) => answers.maintenance_conditional_value,
      frequency: (answers) => answers.maintenance_frequency,
      relevant: (answers) => answers.maintenance_relevant,
    },
    other: {
      amount: (answers) => answers.other_conditional_value,
      relevant: (answers) => answers.other_relevant,
    },
    pension: {
      amount: (answers) => answers.pension_conditional_value,
      frequency: (answers) => answers.pension_frequency,
      relevant: (answers) => answers.pension_relevant,
    },
    propertyOrLodger: {
      amount: (answers) => answers.property_or_lodger_conditional_value,
      frequency: (answers) => answers.property_or_lodger_frequency,
      relevant: (answers) => answers.property_or_lodger_relevant,
    },
    studentFinance: {
      amount: (answers) => answers.student_finance_conditional_value,
      relevant: (answers) => answers.student_finance_relevant,
    },
  },
  payments: {
    childcare: {
      amount: (answers) => answers.childcare_payments_conditional_value,
      frequency: (answers) => answers.childcare_payments_frequency,
      relevant: (answers) => answers.childcare_payments_relevant,
    },
    legalAid: {
      amount: (answers) => answers.legal_aid_payments_conditional_value,
      frequency: (answers) => answers.legal_aid_payments_frequency,
      relevant: (answers) => answers.legal_aid_payments_relevant,
    },
    maintenance: {
      amount: (answers) => answers.maintenance_payments_conditional_value,
      frequency: (answers) => answers.maintenance_payments_frequency,
      relevant: (answers) => answers.maintenance_payments_relevant,
    },
  },
  receivesBenefits: (answers) => answers.receives_benefits,
};

export const partner: AnswerSelection = {
  additionalProperties: (answers) =>
    answers.partner_additional_properties ?? [],
  additionalPropertyOwned: (answers) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CCQ validates completed partner ownership answers.
    return answers.partner_additional_property_owned!;
  },
  assets: {
    bankAccounts: (answers) => answers.partner_bank_accounts,
    investments: {
      amount: (answers) => answers.partner_investments,
      disputed: () => false,
      relevant: (answers) => answers.partner_investments_relevant,
    },
    valuables: {
      amount: (answers) => answers.partner_valuables,
      disputed: () => false,
      relevant: (answers) => answers.partner_valuables_relevant,
    },
  },
  benefits: (answers) => answers.partner_benefits,
  employmentIncomes: (answers) => answers.partner_incomes,
  employmentStatus: (answers) => answers.partner_employment_status,
  isDisputeApplicable: () => false,
  isPresent: (answers) => answers.partner === true,
  otherIncome: {
    friendsOrFamily: {
      amount: (answers) => answers.partner_friends_or_family_conditional_value,
      frequency: (answers) => answers.partner_friends_or_family_frequency,
      relevant: (answers) => answers.partner_friends_or_family_relevant,
    },
    maintenance: {
      amount: (answers) => answers.partner_maintenance_conditional_value,
      frequency: (answers) => answers.partner_maintenance_frequency,
      relevant: (answers) => answers.partner_maintenance_relevant,
    },
    other: {
      amount: (answers) => answers.partner_other_conditional_value,
      relevant: (answers) => answers.partner_other_relevant,
    },
    pension: {
      amount: (answers) => answers.partner_pension_conditional_value,
      frequency: (answers) => answers.partner_pension_frequency,
      relevant: (answers) => answers.partner_pension_relevant,
    },
    propertyOrLodger: {
      amount: (answers) => answers.partner_property_or_lodger_conditional_value,
      frequency: (answers) => answers.partner_property_or_lodger_frequency,
      relevant: (answers) => answers.partner_property_or_lodger_relevant,
    },
    studentFinance: {
      amount: (answers) => answers.partner_student_finance_conditional_value,
      relevant: (answers) => answers.partner_student_finance_relevant,
    },
  },
  payments: {
    childcare: {
      amount: (answers) => answers.partner_childcare_payments_conditional_value,
      frequency: (answers) => answers.partner_childcare_payments_frequency,
      relevant: (answers) => answers.partner_childcare_payments_relevant,
    },
    legalAid: {
      amount: (answers) => answers.partner_legal_aid_payments_conditional_value,
      frequency: (answers) => answers.partner_legal_aid_payments_frequency,
      relevant: (answers) => answers.partner_legal_aid_payments_relevant,
    },
    maintenance: {
      amount: (answers) =>
        answers.partner_maintenance_payments_conditional_value,
      frequency: (answers) => answers.partner_maintenance_payments_frequency,
      relevant: (answers) => answers.partner_maintenance_payments_relevant,
    },
  },
  receivesBenefits: (answers) => answers.partner_receives_benefits,
};
