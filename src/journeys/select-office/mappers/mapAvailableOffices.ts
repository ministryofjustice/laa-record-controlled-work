import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";
import type { Office } from "#/journeys/select-office/select-office.types.js";

import {
  InvalidOfficeError,
  MissingFirmNameError,
  NoAvailableOfficesError,
} from "#/journeys/journey.errors.js";
import { logger } from "#/logger.js";

/**
 * Maps a PDA office list response to office data used by the select-office journey.
 * @param officeList Provider offices response from the PDA API.
 * @returns Mapped office list for journey context.
 */
export function mapAvailableOffices(
  officeList: ProviderFirmOfficeListDto,
): Office[] {
  const EMPTY = 0;
  const firmName = officeList.firm?.firmName;

  if (!firmName) {
    logger.error("ProviderFirmOfficeListDto response data missing firm name", {
      firmName,
    });
    throw new MissingFirmNameError();
  }

  if (!officeList.offices || officeList.offices.length === EMPTY) {
    logger.error("ProviderFirmOfficeListDto response data missing offices", {
      offices: officeList.offices,
    });
    throw new NoAvailableOfficesError();
  }

  return officeList.offices.map((office) => {
    const addressParts = [
      office.addressLine1,
      office.addressLine2,
      office.addressLine3,
      office.addressLine4,
      office.city,
      office.postCode,
    ].filter(Boolean);

    if (!office.firmOfficeCode || addressParts.length === EMPTY) {
      logger.error(
        "ProviderFirmOfficeListDto response data missing firm office code or address",
        { office },
      );
      throw new InvalidOfficeError();
    }

    return {
      address: addressParts.join(", "),
      code: office.firmOfficeCode,
      firmName,
    };
  });
}
