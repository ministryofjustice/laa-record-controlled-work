const MAXIMUM_CURRENCY_FRACTION_DIGITS = 2;
const MINIMUM_CURRENCY_FRACTION_DIGITS = 2;
const MINIMUM_FRACTION_DIGITS_WITHOUT_PENCE = 0;

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
 * Formats a GBP amount using the export's shared currency rules.
 * @param amount Numeric amount to format.
 * @param omitPenceForWholeAmounts Hide pence for whole amounts.
 * @returns The amount formatted in en-GB GBP currency.
 */
export function formatGBP(
  amount: number,
  omitPenceForWholeAmounts = false,
): string {
  const formatter =
    omitPenceForWholeAmounts && Number.isInteger(amount)
      ? currencyWithoutPence
      : currencyWithPence;

  return formatter.format(amount);
}
