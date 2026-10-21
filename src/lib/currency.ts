const MAXIMUM_CURRENCY_FRACTION_DIGITS = 2;
const MINIMUM_CURRENCY_FRACTION_DIGITS = 2;
const MINIMUM_FRACTION_DIGITS_WITHOUT_PENCE = 0;
const ZERO_AMOUNT = 0;

const currencyWithPence = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  maximumFractionDigits: MAXIMUM_CURRENCY_FRACTION_DIGITS,
  minimumFractionDigits: MINIMUM_CURRENCY_FRACTION_DIGITS,
  style: "currency",
});

const currencyWithoutPence = new Intl.NumberFormat("en-GB", {
  currency: "GBP",
  maximumFractionDigits: MAXIMUM_CURRENCY_FRACTION_DIGITS,
  minimumFractionDigits: MINIMUM_FRACTION_DIGITS_WITHOUT_PENCE,
  style: "currency",
});

/**
 * Formats GBP amounts and normalizes negative zero for all callers.
 * @param amount Numeric amount to format.
 * @param omitPenceForWholeAmounts Hide pence for whole amounts.
 * @returns The amount formatted in en-GB GBP currency.
 */
export function formatGBP(
  amount: number,
  omitPenceForWholeAmounts = false,
): string {
  // Intl.NumberFormat renders negative zero with a minus sign.
  // Since -0 equals 0, replace it with positive zero before formatting.
  const currencyAmount = amount === ZERO_AMOUNT ? ZERO_AMOUNT : amount;
  const formatter =
    omitPenceForWholeAmounts && Number.isInteger(currencyAmount)
      ? currencyWithoutPence
      : currencyWithPence;

  return formatter.format(currencyAmount);
}
