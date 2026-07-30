export interface AddressDto {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
  county?: string;
  postcode?: string;
  townOrCity?: string;
}
