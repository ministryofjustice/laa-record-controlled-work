export type ClientAddress =
  { kind: "formatted"; lines: string[] } | { kind: "noFixedAddress" };

export interface ClientAndCaseDetailsSection {
  accessedLegalAidBefore: boolean | null;
  address: ClientAddress;
  confirmMerits: null | string;
  dateOfBirth: string;
  ecf: false;
  evidenceCaseIsInScope: null | string;
  firstName: string;
  lastName: string;
  niNumber: null | string;
  protectThemselfOrChildren: null | string;
  sameMatterDetails: null | SameMatterDetails;
  transitionalEuArrangements: null | string;
  typeOfFamilyLaw: null | string;
}

export interface SameMatterDetails {
  reasonForReapplication: null | string;
  sameMatterWithin6Months: boolean;
}
