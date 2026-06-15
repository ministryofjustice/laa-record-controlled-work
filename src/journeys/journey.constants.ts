export const UK_EXCLUSIVE_ADDRESS_FIELD = {
  county: "county",
  postcode: "postcode",
  townOrCity: "townOrCity",
} as const;

export const OVERSEAS_EXCLUSIVE_ADDRESS_FIELD = {
  addressLine3: "addressLine3",
  addressLine4: "addressLine4",
  country: "country",
} as const;

export const ADDRESS_FIELD = {
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  ...UK_EXCLUSIVE_ADDRESS_FIELD,
  ...OVERSEAS_EXCLUSIVE_ADDRESS_FIELD,
} as const;

export const UK_EXCLUSIVE_ADDRESS_FIELDS = Object.values(
  UK_EXCLUSIVE_ADDRESS_FIELD,
);
export const OVERSEAS_EXCLUSIVE_ADDRESS_FIELDS = Object.values(
  OVERSEAS_EXCLUSIVE_ADDRESS_FIELD,
);
