import { ADDRESS_FIELD } from "#/journeys/journey.constants.js";

export type AddressDto = {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  townOrCity: string;
  postcode?: string;
  county?: string;
  country: string;
};

export type ClientDetailsDto = {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  niNumber?: string;
  hasFixedAddress: boolean;
  address: AddressDto;
};

export type ApplicationDto = {
  ecfFlag: boolean;
  clientDetails: ClientDetailsDto;
  legalAidBefore?: string;
  legalAidLast6Months?: boolean;
  reasonForReapplication?: string;
};

export const fromAnswers = (
  answers: Record<string, unknown>,
): ApplicationDto => {
  const mapped: ApplicationDto = {
    ecfFlag: false,
    clientDetails: {
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      hasFixedAddress: false,
      address: {
        addressLine1: "",
        townOrCity: "",
        country: ""
      },
    },
    legalAidBefore: "yesSameMatter",
    legalAidLast6Months: true,
  };

  mapped.ecfFlag = answers["ecf"] === "true";
  mapped.clientDetails.firstName = answers["firstName"] as string;
  mapped.clientDetails.lastName = answers["lastName"] as string;
  mapped.clientDetails.dateOfBirth = answers["dateOfBirth"] as string;

  if (answers["niNumber"] !== undefined) {
    mapped.clientDetails.niNumber = answers["niNumber"] as string;
  }

  mapped.clientDetails.hasFixedAddress =
    (answers["haveAHomeAddress"] as string) === "yes";

  if (answers[ADDRESS_FIELD.addressLine1] !== undefined) {
    mapped.clientDetails.address = {
      addressLine1: answers[ADDRESS_FIELD.addressLine1] as string,
      addressLine2: answers[ADDRESS_FIELD.addressLine2] as string | undefined,
      addressLine3: answers[ADDRESS_FIELD.addressLine3] as string | undefined,
      addressLine4: answers[ADDRESS_FIELD.addressLine4] as string | undefined,
      townOrCity: answers[ADDRESS_FIELD.townOrCity] as string,
      postcode: answers[ADDRESS_FIELD.postcode] as string | undefined,
      county: answers[ADDRESS_FIELD.county] as string | undefined,
      country: answers[ADDRESS_FIELD.country] as string,
    };
  }

  if (answers["legalAidBefore"] !== undefined) {
    mapped.legalAidBefore = answers["legalAidBefore"] as string;
  }

  if (answers["legalAidLast6Months"] !== undefined) {
    mapped.legalAidLast6Months =
      (answers["legalAidLast6Months"] as string) === "yes";
  }

  if (answers["reasonForYes"] !== undefined) {
    mapped.reasonForReapplication = answers["reasonForYes"] as string;
  }

  return mapped;
};
