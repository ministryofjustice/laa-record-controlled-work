export const UK_EXCLUSIVE_ADDRESS_FIELD = {
  county: "county",
  postcode: "postcode",
  townOrCity: "townOrCity",
} as const;

export const OVERSEAS_EXCLUSIVE_ADDRESS_FIELD = {
  addressLine3: "addressLine3",
  addressLine4: "addressLine4",
} as const;

export const ADDRESS_FIELD = {
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  ...UK_EXCLUSIVE_ADDRESS_FIELD,
  ...OVERSEAS_EXCLUSIVE_ADDRESS_FIELD,
  country: "country",
} as const;

export const UK_EXCLUSIVE_ADDRESS_FIELDS = Object.values(
  UK_EXCLUSIVE_ADDRESS_FIELD,
);
export const OVERSEAS_EXCLUSIVE_ADDRESS_FIELDS = Object.values(
  OVERSEAS_EXCLUSIVE_ADDRESS_FIELD,
);

export const CONTEXT_DATA_KEYS = {
  caseList: "caseList",
  selectedOffice: "selectedOffice",
  singleOffice: "singleOffice",
};

export const ANSWER_CODES = {
  addressLine1: "addressLine1",
  addressLine2: "addressLine2",
  addressLine3: "addressLine3",
  addressLine4: "addressLine4",
  country: "country",
  county: "county",
  dateOfBirth: "dateOfBirth",
  ecf: "ecf",
  firstName: "firstName",
  hasNINumber: "hasNINumber",
  haveAHomeAddress: "haveAHomeAddress",
  lastName: "lastName",
  legalAidBefore: "legalAidBefore",
  legalAidLast6Months: "legalAidLast6Months",
  niNumber: "niNumber",
  postcode: "postcode",
  reasonForYes: "reasonForYes",
  townOrCity: "townOrCity",
} as const;

export const ANSWER_VALUES = {
  no: "no",
  yes: "yes",
  yesDifferentMatter: "yesDifferentMatter",
  yesSameMatter: "yesSameMatter",
} as const;
