import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import { ADDRESS_FIELD } from "#/journeys/journey.constants.js";

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

export interface ApplicationDto {
  clientDetails: ClientDetailsDto;
  ecfFlag: boolean;
  legalAidBefore: string;
  legalAidLast6Months?: boolean;
  reasonForReapplication?: string;
}

export interface ClientDetailsDto {
  address: AddressDto;
  dateOfBirth: string;
  firstName: string;
  hasFixedAddress: boolean;
  lastName: string;
  niNumber?: string;
}

export const fromAnswers = (answers: AnswersOutput): ApplicationDto => {
  const mapped: ApplicationDto = {
    clientDetails: {
      address: {
        addressLine1: "",
        country: "",
      },
      dateOfBirth: "",
      firstName: "",
      hasFixedAddress: false,
      lastName: "",
    },
    ecfFlag: false,
    legalAidBefore: "yesSameMatter",
    legalAidLast6Months: true,
  };

  mapped.ecfFlag = answers.ecf === "true";
  mapped.clientDetails.firstName = answers.firstName;
  mapped.clientDetails.lastName = answers.lastName;
  mapped.clientDetails.dateOfBirth = answers.dateOfBirth;

  if (answers.niNumber !== undefined) {
    mapped.clientDetails.niNumber = answers.niNumber;
  }

  mapped.clientDetails.hasFixedAddress = answers.haveAHomeAddress === "yes";

  if (answers[ADDRESS_FIELD.addressLine1] !== undefined) {
    mapped.clientDetails.address = {
      addressLine1: answers[ADDRESS_FIELD.addressLine1],
      addressLine2: answers[ADDRESS_FIELD.addressLine2],
      addressLine3: answers[ADDRESS_FIELD.addressLine3],
      addressLine4: answers[ADDRESS_FIELD.addressLine4],
      country: answers[ADDRESS_FIELD.country],
      county: answers[ADDRESS_FIELD.county],
      postcode: answers[ADDRESS_FIELD.postcode],
      townOrCity: answers[ADDRESS_FIELD.townOrCity],
    };
  }

  if (answers.legalAidBefore !== undefined) {
    mapped.legalAidBefore = answers.legalAidBefore;
  }

  if (answers.legalAidLast6Months !== undefined) {
    mapped.legalAidLast6Months = answers.legalAidLast6Months === "yes";
  }

  if (answers.reasonForYes !== undefined) {
    mapped.reasonForReapplication = answers.reasonForYes;
  }

  return mapped;
};
