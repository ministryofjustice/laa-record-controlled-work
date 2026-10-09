export interface IncomeFrequencyChoices extends StandardFrequencyChoices {
  three_months: "frequencies.threeMonths";
}

export interface OtherIncomeFrequencies extends StandardFrequencyChoices {
  total: "frequencies.threeMonths";
}

export interface PaymentFrequencyChoices extends StandardFrequencyChoices {
  monthly: "frequencies.everyMonth";
  total: "frequencies.threeMonths";
}

export interface StandardFrequencyChoices extends Record<string, string> {
  every_four_weeks: "frequencies.everyFourWeeks";
  every_two_weeks: "frequencies.everyTwoWeeks";
  every_week: "frequencies.everyWeek";
  monthly: "frequencies.everyMonth" | "frequencies.monthly";
}

export const standardFrequencyChoices: StandardFrequencyChoices = {
  every_four_weeks: "frequencies.everyFourWeeks",
  every_two_weeks: "frequencies.everyTwoWeeks",
  every_week: "frequencies.everyWeek",
  monthly: "frequencies.monthly",
} as const;

export const incomeFrequencies: IncomeFrequencyChoices = {
  ...standardFrequencyChoices,
  three_months: "frequencies.threeMonths",
} as const;

export const otherIncomeFrequencies: OtherIncomeFrequencies = {
  ...standardFrequencyChoices,
  total: "frequencies.threeMonths",
} as const;

export const paymentFrequencies: PaymentFrequencyChoices = {
  ...standardFrequencyChoices,
  monthly: "frequencies.everyMonth",
  total: "frequencies.threeMonths",
} as const;
