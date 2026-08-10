import countries from "#/lib/constants/FCDOGeographicalNamesIndexSeptember2025.json" with { type: "json" };

export const COUNTRY_NAMES = countries.map((country) => country.name);

const COUNTRY_CODE_BY_NAME = new Map(
  countries.map((country) => [country.name, country.code]),
);

const COUNTRY_NAME_BY_CODE = new Map(
  countries.map((country) => [country.code, country.name]),
);

/**
 * Convert country name to ISO 3166 alpha-2 country code.
 * @param country Country name.
 * @returns string ISO 3166 alpha-2 country code.
 */
export const mapCountryNameToIsoCode = (country: string): string =>
  COUNTRY_CODE_BY_NAME.get(country) ?? country;

/**
 * Convert ISO 3166 alpha-2 country code to country name.
 * @param countryCode ISO 3166 alpha-2 country code.
 * @returns string Country name.
 */
export const mapIsoCodeToCountryName = (countryCode: string): string =>
  COUNTRY_NAME_BY_CODE.get(countryCode) ?? countryCode;
