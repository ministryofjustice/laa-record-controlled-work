import { z } from "zod";

import type { ProviderFirmOfficeListDto } from "#/api/clients/pda/model/providerFirmOfficeListDto.zod.gen.js";

export const OfficeSchema = z.object({
  address: z.string(),
  code: z.string(),
  firmName: z.string().optional(),
});

export const OFFICE_FIELD = OfficeSchema.keyof().enum;

export type Office = z.infer<typeof OfficeSchema>;

type PdaOffice = NonNullable<ProviderFirmOfficeListDto["offices"]>[number];

/**
 * Data transfer object for one mapped office.
 */
export class OfficeDto {
  public readonly address: string;
  public readonly code: string;
  public readonly firmName?: string;

  /**
   * Constructs an OfficeDto.
   * @param data Office DTO fields.
   */
  public constructor(data: Office) {
    this.address = data.address;
    this.code = data.code;
    this.firmName = data.firmName;
  }

  /**
   * Creates an OfficeDto from one PDA office object.
   * @param office Office object from the PDA API.
   * @param firmName Firm name from the PDA API.
   * @returns OfficeDto instance.
   */
  public static fromPdaOffice(office: PdaOffice, firmName?: string): OfficeDto {
    const addressParts = [
      office.addressLine1,
      office.addressLine2,
      office.addressLine3,
      office.addressLine4,
      office.city,
      office.postCode,
    ].filter(Boolean);

    return new OfficeDto({
      address: addressParts.join(", "),
      code: office.firmOfficeCode ?? "",
      firmName,
    });
  }

  /**
   * Maps offices from the API response.
   * @param officeList Office list object from the API.
   * @returns Array of mapped offices in the application format.
   */
  public static mapOffices(officeList: ProviderFirmOfficeListDto): Office[] {
    const firmName = officeList.firm?.firmName ?? undefined;
    const offices = officeList.offices ?? [];

    return offices.map((office) =>
      OfficeDto.fromPdaOffice(office, firmName).toOffice(),
    );
  }

  /**
   * Converts the OfficeDto into the internal Office shape.
   * @returns Mapped office in the application format.
   */
  public toOffice(): Office {
    return {
      address: this.address,
      code: this.code,
      firmName: this.firmName,
    };
  }
}
