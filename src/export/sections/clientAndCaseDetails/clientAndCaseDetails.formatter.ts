import type { ClientDetails } from "#/api/clients/rcw/model/clientDetails.zod.gen.js";
import type { ClientAddress } from "#/export/sections/clientAndCaseDetails/clientAndCaseDetails.types.js";

import { mapIsoCodeToCountryName } from "#/lib/countries.js";

const DATE_OF_BIRTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

/**
 * Formats client address data for the export view.
 * @param clientDetails Client details returned by the application API.
 * @returns A no-fixed-address state or formatted address lines.
 */
export function formatClientAddress(
  clientDetails: ClientDetails,
): ClientAddress {
  if (!clientDetails.hasFixedAddress) {
    return { kind: "noFixedAddress" };
  }

  const { address } = clientDetails;
  if (!address) {
    return { kind: "formatted", lines: [] };
  }

  const countryCode = address.country.trim();
  const countryName = mapIsoCodeToCountryName(countryCode);
  const lines =
    countryCode === "GB"
      ? [
          address.addressLine1,
          address.addressLine2,
          address.townOrCity,
          address.county,
          address.postCode,
        ]
      : [
          address.addressLine1,
          address.addressLine2,
          address.addressLine3,
          address.addressLine4,
          countryName,
        ];

  return { kind: "formatted", lines: compactAddressLines(lines) };
}

/**
 * Formats an ISO date of birth without applying the server's local timezone.
 * @param dateOfBirth ISO date returned by the application API.
 * @returns The date formatted for display in English.
 */
export function formatDateOfBirth(dateOfBirth: string): string {
  return DATE_OF_BIRTH_FORMATTER.format(new Date(dateOfBirth));
}

/**
 * Trims an optional value and normalises blank values to null.
 * @param value Optional text returned by the application API.
 * @returns Trimmed text, or null when it is absent or blank.
 */
export function normaliseOptionalText(
  value: null | string | undefined,
): null | string {
  const trimmedValue = value?.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue;
}

/**
 * Trims address lines and removes values that are empty.
 * @param lines Address lines in display order.
 * @returns Nonblank trimmed address lines.
 */
function compactAddressLines(
  lines: Array<null | string | undefined>,
): string[] {
  return lines
    .map((line) => line?.trim())
    .filter((line): line is string => Boolean(line));
}
