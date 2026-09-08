import type { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import {
  OVERSEAS_ADDRESS_FIELDS,
  UK_ADDRESS_FIELDS,
} from "#/journeys/journey.constants.js";
import { mapCountryNameToIsoCode } from "#/lib/countries.js";

interface Application {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
  county?: string;
  dateOfBirth: string;
  firstName: string;
  hasFixedAddress: boolean;
  lastName: string;
  legalAidBefore: string;
  legalAidLast6Months?: boolean;
  niNumber?: string;
  postcode?: string;
  providerOfficeCode: string;
  reasonForReapplication?: string;
  scopingQuestions: Record<string, unknown>;
  townOrCity?: string;
}

interface Address {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
  county?: string;
  postcode?: string;
  townOrCity?: string;
}

/**
 * Data transfer object for an application.
 * @param application - The application data to be transferred.
 */
export class ApplicationDto {
  public addressLine1 = "";
  public addressLine2?: string;
  public addressLine3?: string;
  public addressLine4?: string;
  public country = "";
  public county?: string;
  public dateOfBirth = "";
  public firstName = "";
  public hasFixedAddress = false;
  public lastName = "";
  public legalAidBefore = "";
  public legalAidLast6Months?: boolean;
  public niNumber?: string;
  public postcode?: string;
  public providerOfficeCode = "";
  public reasonForReapplication?: string;
  public scopingQuestions: Record<string, unknown> = {};
  public townOrCity?: string;

  /**
   * Constructs an ApplicationDto instance from the given application data.
   * @param application - The application data to be transferred.
   */
  public constructor(application: Application) {
    Object.assign(this, application);
  }

  /**
   * Creates an ApplicationDto instance from the provided answers.
   * @param answers - The answers from which to create the ApplicationDto instance.
   * @param providerOfficeCode - The provider office code to be included in the ApplicationDto instance.
   * @returns ApplicationDto instance.
   */
  public static fromAnswers(
    answers: AnswersOutput,
    providerOfficeCode: string,
  ): ApplicationDto {
    return new ApplicationDto({
      ...this.getAddressFromAnswers(answers),
      dateOfBirth: answers.dateOfBirth,
      firstName: answers.firstName,
      hasFixedAddress: answers.haveAHomeAddress === "yes",
      lastName: answers.lastName,
      legalAidBefore: answers.legalAidBefore,
      legalAidLast6Months: answers.legalAidLast6Months === "yes",
      niNumber: answers.niNumber,
      providerOfficeCode,
      reasonForReapplication: answers.reasonForYes,
      scopingQuestions: {
        priorLegalAid: answers.legalAidBefore,
      },
    });
  }

  /**
   * Set the address fields based off whether the address is UK or overseas.
   * @param answers
   */
  public static getAddressFromAnswers(answers: AnswersOutput) {
    const isUkAddress = answers[UK_ADDRESS_FIELDS.country] === "United Kingdom";

    const countryName = isUkAddress
      ? answers[UK_ADDRESS_FIELDS.country]
      : answers[OVERSEAS_ADDRESS_FIELDS.country];
    const hasFixedAddress = answers.haveAHomeAddress === "yes";

    return {
      addressLine1: isUkAddress
        ? answers[UK_ADDRESS_FIELDS.addressLine1]
        : answers[OVERSEAS_ADDRESS_FIELDS.addressLine1],
      addressLine2: isUkAddress
        ? answers[UK_ADDRESS_FIELDS.addressLine2]
        : answers[OVERSEAS_ADDRESS_FIELDS.addressLine2],
      addressLine3: isUkAddress
        ? ""
        : answers[OVERSEAS_ADDRESS_FIELDS.addressLine3],
      addressLine4: isUkAddress
        ? ""
        : answers[OVERSEAS_ADDRESS_FIELDS.addressLine4],
      country:
        hasFixedAddress && countryName
          ? mapCountryNameToIsoCode(countryName)
          : "",
      county: isUkAddress ? answers[UK_ADDRESS_FIELDS.county] : "",
      postcode: isUkAddress ? answers[UK_ADDRESS_FIELDS.postcode] : "",
      townOrCity: isUkAddress ? answers[UK_ADDRESS_FIELDS.townOrCity] : "",
    } as Address;
  }

  /**
   * Converts the ApplicationDto instance to an object that conforms to the data structure expected by the RCW API.
   * @returns CreateApplicationRequestBody.
   */
  public toRcwApi(): CreateApplicationRequestBody {
    const clientDetails: CreateApplicationRequestBody["clientDetails"] = {
      dateOfBirth: this.dateOfBirth,
      firstName: this.firstName,
      hasFixedAddress: this.hasFixedAddress,
      lastName: this.lastName,
      niNumber: this.niNumber,
    };

    if (this.hasFixedAddress) {
      clientDetails.address = {
        addressLine1: this.addressLine1,
        addressLine2: this.addressLine2,
        addressLine3: this.addressLine3,
        addressLine4: this.addressLine4,
        country: this.country,
        county: this.county,
        postCode: this.postcode,
        townOrCity: this.townOrCity,
      };
    }

    return {
      clientDetails,
      legalAidBefore: this.legalAidBefore,
      legalAidLast6Months: this.legalAidLast6Months,
      providerOfficeCode: this.providerOfficeCode,
      reasonForReapplication: this.reasonForReapplication,
      scopingQuestions: this.scopingQuestions,
    };
  }
}
