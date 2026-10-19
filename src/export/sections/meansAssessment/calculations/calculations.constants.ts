// CFE's saved sentinel for an unlimited threshold.
export const CFE_MAX_VALUE = 999_999_999_999;

// CCQ CalculationResult#ALLOWED_HOUSING_COSTS_CAP; selects a hint only.
// Recheck when CCQ changes the policy wording or threshold.
export const HOUSING_COSTS_CAP_HINT_THRESHOLD = 545;

// CCQ DependantIncomeModel#dependant_monthly_upper_limit; copied hint text only.
// Recheck when CCQ changes the dependant allowance.
export const DEPENDANT_MONTHLY_ALLOWANCE_HINT = "£381.86";

// CCQ CfeResult#raw_total_calculated_capital floors this display value at zero.
export const MINIMUM_ASSESSED_CAPITAL = 0;

// CCQ ChildcareEligibilityService#in_work? excludes this income type.
export const STATUTORY_PAY_INCOME_TYPE = "statutory_pay";
