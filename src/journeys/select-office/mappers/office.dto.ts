import type {
  Office,
  PdaOffice,
} from "#/journeys/select-office/select-office.types.js";

/**
 * Maps an array of offices from the API response
 * @param offices Array of offices from the API
 * @returns Array of mapped offices in the application format
 */
export function mapOffices(offices: PdaOffice[]): Office[] {
  return offices.map(mapOffice);
}

/**
 * Maps an office object from the API response to the application's internal format
 * @param office Office object from the API
 * @returns Mapped office in the application format
 */
function mapOffice(office: PdaOffice): Office {
  const addressParts = [
    office.addressLine1,
    office.addressLine2,
    office.addressLine3,
    office.addressLine4,
    office.city,
  ].filter(Boolean);

  return {
    address: addressParts.join(", "),
    code: office.firmOfficeCode ?? "",
    officeName: office.officeName ?? "",
    postCode: office.postCode ?? "",
  };
}
