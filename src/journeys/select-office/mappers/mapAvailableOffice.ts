import type { ProviderFirmOfficeDto } from "#/api/clients/pda/model/providerFirmOfficeDto.zod.gen.js";
import type { Office } from "#/journeys/select-office/select-office.types.js";

import { InvalidOfficeError } from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

const EMPTY = 0;

/**
 * Maps one PDA office detail to select-office data.
 * @param officeDetails Validated PDA office response.
 * @returns Detailed office data for journey context.
 */
export function mapAvailableOffice(
  officeDetails: ProviderFirmOfficeDto,
): Office {
  const { firm, office } = officeDetails;
  const firmName = firm?.firmName;

  const addressParts = getAddressParts(office);

  if (!office?.firmOfficeCode || addressParts.length === EMPTY) {
    logger.error(
      "Provider office details are missing an office code or address",
    );
    throw new InvalidOfficeError();
  }

  return {
    address: addressParts.join(", "),
    code: office.firmOfficeCode,
    ...(firmName && { firmName }),
  };
}

/**
 * Collects non-empty display fields from an office response.
 * @param office PDA office details.
 * @returns Address parts in display order.
 */
function getAddressParts(office: ProviderFirmOfficeDto["office"]): string[] {
  return [
    office?.addressLine1,
    office?.addressLine2,
    office?.addressLine3,
    office?.addressLine4,
    office?.city,
    office?.postCode,
  ].filter((part): part is string => Boolean(part));
}
