import type { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import { ADDRESS_FIELD } from "#/journeys/journey.constants.js";
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
    const hasFixedAddress = answers.haveAHomeAddress === "yes";
    const countryName = answers[ADDRESS_FIELD.country];

    return new ApplicationDto({
      addressLine1: answers[ADDRESS_FIELD.addressLine1] ?? "",
      addressLine2: answers[ADDRESS_FIELD.addressLine2],
      addressLine3: answers[ADDRESS_FIELD.addressLine3],
      addressLine4: answers[ADDRESS_FIELD.addressLine4],
      country:
        hasFixedAddress && countryName
          ? mapCountryNameToIsoCode(countryName)
          : "",
      county: answers[ADDRESS_FIELD.county],
      dateOfBirth: answers.dateOfBirth,
      firstName: answers.firstName,
      hasFixedAddress,
      lastName: answers.lastName,
      legalAidBefore: answers.legalAidBefore,
      legalAidLast6Months: answers.legalAidLast6Months === "yes",
      niNumber: answers.niNumber,
      postcode: answers[ADDRESS_FIELD.postcode],
      providerOfficeCode,
      reasonForReapplication: answers.reasonForYes,
      scopingQuestions: {
        priorLegalAid: answers.legalAidBefore,
      },
      townOrCity: answers[ADDRESS_FIELD.townOrCity],
    });
  }

  /**
   * Creates an answers output instance from the provided application.
   * @param application - The application from which to create the answers output instance.
   * @returns AnswersOutput instance.
   */
  public static toAnswers(application: CreateApplicationRequestBody): AnswersOutput {
    return {
      [AnswerKey.addressLine1]: application.clientDetails.address?.addressLine1,
      [AnswerKey.addressLine2]: application.clientDetails.address?.addressLine2,
      [AnswerKey.addressLine3]: application.clientDetails.address?.addressLine3,
      [AnswerKey.addressLine4]: application.clientDetails.address?.addressLine4,
      [AnswerKey.country]: application.clientDetails.address?.country,
      [AnswerKey.county]: application.clientDetails.address?.county,
      [AnswerKey.dateOfBirth]: application.clientDetails.dateOfBirth,
      [AnswerKey.ecf]: "no",
      [AnswerKey.firstName]: application.clientDetails.firstName,
      [AnswerKey.hasNINumber]: application.clientDetails.niNumber ? "yes" : "no",
      [AnswerKey.haveAHomeAddress]: application.clientDetails.hasFixedAddress ? "yes" : "no",
      [AnswerKey.lastName]: application.clientDetails.lastName,
      [AnswerKey.legalAidBefore]: application.scopingQuestions?.priorLegalAid as string,
      [AnswerKey.legalAidLast6Months]: application.legalAidLast6Months ? "yes" : "no",
      [AnswerKey.niNumber]: application.clientDetails.niNumber,
      [AnswerKey.postcode]: application.clientDetails.address?.postCode,
      [AnswerKey.reasonForYes]: application.reasonForReapplication,
      [AnswerKey.townOrCity]: application.clientDetails.address?.townOrCity,
    };
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
