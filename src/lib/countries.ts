import countries from "#/lib/constants/FCDOGeographicalNamesIndexSeptember2025.json" with { type: "json" };

export const COUNTRY_NAMES = countries.map((country) => country.name);

const COUNTRY_CODE_BY_NAME = new Map(
  countries.map((country) => [country.name, country.code]),
);

const COUNTRY_NAME_BY_CODE = new Map(
  countries.map((country) => [country.code, country.name]),
);

export const mapCountryNameToIsoCode = (country: string): string =>
  COUNTRY_CODE_BY_NAME.get(country) ?? country;

export const mapIsoCodeToCountryName = (countryCode: string): string =>
  COUNTRY_NAME_BY_CODE.get(countryCode) ?? countryCode;
