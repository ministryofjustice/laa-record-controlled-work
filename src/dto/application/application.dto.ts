import { ApplicationDtoInterface } from "./application.dto.interface.js";
import { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";
import { ADDRESS_FIELD } from "#/journeys/journey.constants.js";

interface Application {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  hasFixedAddress: boolean;
  niNumber?: string;
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
  county?: string;
  postcode?: string;
  townOrCity?: string;
  ecfFlag: boolean;
  legalAidBefore: string;
  legalAidLast6Months?: boolean;
  reasonForReapplication?: string;
}

export class ApplicationDto {
  public firstName: string = "";
  public lastName: string = "";
  public dateOfBirth: string = "";
  public hasFixedAddress: boolean = false;
  public niNumber?: string;
  public addressLine1: string = "";
  public addressLine2?: string;
  public addressLine3?: string;
  public addressLine4?: string;
  public country: string = "";
  public county?: string;
  public postcode?: string;
  public townOrCity?: string;
  public ecfFlag: boolean = false;
  public legalAidBefore: string = "";
  public legalAidLast6Months?: boolean;
  public reasonForReapplication?: string;

  private requiredKeys: string[] = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "hasFixedAddress",
    "addressLine1",
    "country",
    "ecfFlag",
    "legalAidBefore",
  ];

  public constructor(application: Application) {
    this.requiredKeys.forEach((key) => {
      if (!(key in application)) {
        throw new Error(`Missing required property: ${key}`);
      }
    });
    Object.assign(this, application);
  }

  public static fromAnswers(answers: AnswersOutput): ApplicationDto {
    return new ApplicationDto({
      firstName: answers.firstName,
      lastName: answers.lastName,
      dateOfBirth: answers.dateOfBirth,
      hasFixedAddress: answers.haveAHomeAddress === "yes",
      niNumber: answers.niNumber,
      addressLine1: answers[ADDRESS_FIELD.addressLine1],
      addressLine2: answers[ADDRESS_FIELD.addressLine2],
      addressLine3: answers[ADDRESS_FIELD.addressLine3],
      addressLine4: answers[ADDRESS_FIELD.addressLine4],
      country: answers[ADDRESS_FIELD.country],
      county: answers[ADDRESS_FIELD.county],
      postcode: answers[ADDRESS_FIELD.postcode],
      townOrCity: answers[ADDRESS_FIELD.townOrCity],
      ecfFlag: answers.ecf === "true",
      legalAidBefore: answers.legalAidBefore,
      legalAidLast6Months:
        answers.legalAidLast6Months === "yes" ? true : false,
      reasonForReapplication: answers.reasonForYes,
    });
  }

  public toRcwApi(): ApplicationDtoInterface {
    return {
      clientDetails: {
        firstName: this.firstName,
        lastName: this.lastName,
        dateOfBirth: this.dateOfBirth,
        hasFixedAddress: this.hasFixedAddress,
        niNumber: this.niNumber,
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
      },
      ecfFlag: this.ecfFlag,
      legalAidBefore: this.legalAidBefore,
      legalAidLast6Months: this.legalAidLast6Months,
      reasonForReapplication: this.reasonForReapplication,
    };
  }
}
