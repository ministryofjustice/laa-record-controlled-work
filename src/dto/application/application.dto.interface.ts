import { ClientDetailsDto } from "#/dto/clientDetails/clientDetails.dto.interface.js";

export interface ApplicationDtoInterface {
  clientDetails: ClientDetailsDto;
  ecfFlag: boolean;
  legalAidBefore: string;
  legalAidLast6Months?: boolean;
  reasonForReapplication?: string;
}