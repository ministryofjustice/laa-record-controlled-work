import type { AddressDto } from "#/dto/address/address.dto.interface.js";

export interface ClientDetailsDto {
  address: AddressDto;
  dateOfBirth: string;
  firstName: string;
  hasFixedAddress: boolean;
  lastName: string;
  niNumber?: string;
}
