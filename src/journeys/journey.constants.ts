export const UK_ADDRESS_FIELD = {
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  county: "county",
  postcode: "postcode",
  townOrCity: "townOrCity",
} as const;

export const UK_ADDRESS_FIELDS = Object.values(UK_ADDRESS_FIELD);

export const OVERSEAS_ADDRESS_FIELD = {
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  addressLine3: "addressLine3",
  addressLine4: "addressLine4",
  country: "country",
} as const;

export const OVERSEAS_ADDRESS_FIELDS = Object.values(OVERSEAS_ADDRESS_FIELD);
