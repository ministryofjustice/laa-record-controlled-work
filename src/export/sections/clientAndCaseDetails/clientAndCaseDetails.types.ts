export interface ClientAndCaseDetailsSection {
  accessedLegalAidBefore: boolean | null;
  address: null | string[];
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
