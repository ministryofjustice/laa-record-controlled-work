import { Address } from "#/api/clients/rcw/model/address.zod.gen.js";
import { Application } from "#/api/clients/rcw/model/application.zod.gen.js";
import { Applications } from "#/api/clients/rcw/model/applications.zod.gen.js";

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
  application: "application",
  applicationID: "applicationID",
  applicationStatus: "applicationStatus",
  availableOffices: "availableOffices",
  caseList: "caseList",
  clientDetailsStatus: "clientDetailsStatus",
  declarationStatus: "declarationStatus",
  evidenceStatus: "evidenceStatus",
  meansAssessment: "meansAssessment",
  readyForSubmission: "readyForSubmission",
  selectedOffice: "selectedOffice",
  singleOffice: "singleOffice",
} as const;

export const PARAMS_KEYS = {
  applicationID: "applicationID",
};

export const APPLICATIONS_DATA_KEYS = Applications.element.keyof().enum;
export const APPLICATION_DATA_KEYS = Application.keyof().enum;
export const CLIENT_DETAILS_DATA_KEYS = {
  address: "clientDetails.address",
  addressLine1: "clientDetails.address.addressLine1",
  addressLine2: "clientDetails.address.addressLine2",
  addressLine3: "clientDetails.address.addressLine3",
  addressLine4: "clientDetails.address.addressLine4",
  country: "clientDetails.address.country",
  county: "clientDetails.address.county",
  createdAt: "clientDetails.createdAt",
  dateOfBirth: "clientDetails.dateOfBirth",
  firstName: "clientDetails.firstName",
  hasFixedAddress: "clientDetails.hasFixedAddress",
  id: "clientDetails.id",
  lastName: "clientDetails.lastName",
  modifiedAt: "clientDetails.modifiedAt",
  niNumber: "clientDetails.niNumber",
  postcode: "clientDetails.address.postCode",
  townOrCity: "clientDetails.address.townOrCity",
} as const;
export const ADDRESS_DATA_KEYS = Address.keyof().enum;
