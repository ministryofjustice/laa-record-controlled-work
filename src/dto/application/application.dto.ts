import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import { ADDRESS_FIELD } from "#/journeys/journey.constants.js";

import type { ApplicationDtoInterface } from "./application.dto.interface.js";

interface Application {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
  county?: string;
  dateOfBirth: string;
  ecfFlag: boolean;
  firstName: string;
  hasFixedAddress: boolean;
  lastName: string;
  legalAidBefore: string;
  legalAidLast6Months?: boolean;
  niNumber?: string;
  postcode?: string;
  reasonForReapplication?: string;
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
  public ecfFlag = false;
  public firstName = "";
  public hasFixedAddress = false;
  public lastName = "";
  public legalAidBefore = "";
  public legalAidLast6Months?: boolean;
  public niNumber?: string;
  public postcode?: string;
  public reasonForReapplication?: string;
  public townOrCity?: string;

  private readonly requiredKeys: string[] = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "hasFixedAddress",
    "addressLine1",
    "country",
    "ecfFlag",
    "legalAidBefore",
  ];

  /**
   * Constructs an ApplicationDto instance from the given application data.
   * @param application - The application data to be transferred.
   */
  public constructor(application: Application) {
    this.requiredKeys.forEach((key) => {
      if (!(key in application)) {
        throw new Error(`Missing required property: ${key}`);
      }
    });
    Object.assign(this, application);
  }

  /**
   * Creates an ApplicationDto instance from the provided answers.
   * @param answers - The answers from which to create the ApplicationDto instance.
   * @returns ApplicationDto instance.
   */
  public static fromAnswers(answers: AnswersOutput): ApplicationDto {
    return new ApplicationDto({
      addressLine1: answers[ADDRESS_FIELD.addressLine1],
      addressLine2: answers[ADDRESS_FIELD.addressLine2],
      addressLine3: answers[ADDRESS_FIELD.addressLine3],
      addressLine4: answers[ADDRESS_FIELD.addressLine4],
      country: answers[ADDRESS_FIELD.country],
      county: answers[ADDRESS_FIELD.county],
      dateOfBirth: answers.dateOfBirth,
      ecfFlag: answers.ecf === "true",
      firstName: answers.firstName,
      hasFixedAddress: answers.haveAHomeAddress === "yes",
      lastName: answers.lastName,
      legalAidBefore: answers.legalAidBefore,
      legalAidLast6Months: answers.legalAidLast6Months === "yes",
      niNumber: answers.niNumber,
      postcode: answers[ADDRESS_FIELD.postcode],
      reasonForReapplication: answers.reasonForYes,
      townOrCity: answers[ADDRESS_FIELD.townOrCity],
    });
  }

  /**
   * Converts the ApplicationDto instance to an object that conforms to the data structure expected by the RCW API.
   * @returns ApplicationDtoInterface.
   */
  public toRcwApi(): ApplicationDtoInterface {
    return {
      clientDetails: {
        address: {
          addressLine1: this.addressLine1,
          addressLine2: this.addressLine2,
          addressLine3: this.addressLine3,
          addressLine4: this.addressLine4,
          country: this.country,
          county: this.county,
          postcode: this.postcode,
          townOrCity: this.townOrCity,
        },
        dateOfBirth: this.dateOfBirth,
        firstName: this.firstName,
        hasFixedAddress: this.hasFixedAddress,
        lastName: this.lastName,
        niNumber: this.niNumber,
      },
      ecfFlag: this.ecfFlag,
      legalAidBefore: this.legalAidBefore,
      legalAidLast6Months: this.legalAidLast6Months,
      reasonForReapplication: this.reasonForReapplication,
    };
  }
}
