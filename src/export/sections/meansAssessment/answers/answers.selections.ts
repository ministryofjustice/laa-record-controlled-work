import type { AnswerSelection } from "#/export/sections/meansAssessment/answers/questions/questions.types.js";

/** Selectors for the client fields saved by CCQ. */
export const client: AnswerSelection = {
  benefits: (answers) => answers.benefits,
  employmentIncomes: (answers) => answers.incomes,
  employmentStatus: (answers) => answers.employment_status,
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
  receivesBenefits: (answers) => answers.receives_benefits,
};

export const partner: AnswerSelection = {
  benefits: (answers) => answers.partner_benefits,
  employmentIncomes: (answers) => answers.partner_incomes,
  employmentStatus: (answers) => answers.partner_employment_status,
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
  receivesBenefits: (answers) => answers.partner_receives_benefits,
};
