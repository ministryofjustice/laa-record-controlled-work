/**
 * Creates a transformer that normalises a National Insurance number.
 *
 * @returns A transformer that removes punctuation and uppercases letters.
 */
export function normaliseNiNumber(): (value: unknown) => string {
  return (value: unknown) => {
    if (typeof value !== "string") {
      throw new TypeError("normaliseNiNumber expects a string");
    }

    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  };
}
