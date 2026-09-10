import type { Application as ApplicationZod } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
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

interface OverseasAddress {
  addressLine1: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country: string;
}

interface UkAddress {
  addressLine1: string;
  addressLine2?: string;
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
    const hasFixedAddress = answers.haveAHomeAddress === "yes";

    return new ApplicationDto({
      ...this.getAddressFromAnswers(answers, hasFixedAddress),
      dateOfBirth: answers.dateOfBirth,
      firstName: answers.firstName,
      hasFixedAddress,
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
   * @param answers - The answers from which to extract the address fields.
   * @param hasFixedAddress - boolean reused from above.
   * @returns Address object containing the address fields.
   */
  public static getAddressFromAnswers(
    answers: AnswersOutput,
    hasFixedAddress: boolean,
  ): OverseasAddress | UkAddress {
    const isUkAddress = answers[AnswerKey.ukCountry] === "United Kingdom";

    return isUkAddress
      ? this.getUkAddressFromAnswers(answers, hasFixedAddress)
      : this.getOverseasAddressFromAnswers(answers, hasFixedAddress);
  }

  /**
   * Creates an answers output instance from the provided application.
   * @param application - The application from which to create the answers output instance.
   * @returns AnswersOutput instance.
   */
  public static toAnswers(application: ApplicationZod): AnswersOutput {
    const addressAnswers =
      application.clientDetails.address?.country === "GB"
        ? this.getAnswersFromUkAddress(
            application.clientDetails.address as UkAddress,
          )
        : this.getAnswersFromOverseasAddress(
            application.clientDetails.address as OverseasAddress,
          );

    return {
      ...addressAnswers,
      [AnswerKey.dateOfBirth]: application.clientDetails.dateOfBirth,
      [AnswerKey.ecf]: "no",
      [AnswerKey.firstName]: application.clientDetails.firstName,
      [AnswerKey.hasNINumber]: application.clientDetails.niNumber
        ? "yes"
        : "no",
      [AnswerKey.haveAHomeAddress]: application.clientDetails.hasFixedAddress
        ? "yes"
        : "no",
      [AnswerKey.lastName]: application.clientDetails.lastName,
      [AnswerKey.legalAidBefore]: application.scopingQuestions
        ?.priorLegalAid as string,
      [AnswerKey.niNumber]: application.clientDetails.niNumber ?? "",
      [AnswerKey.reasonForYes]: application.reasonForReapplication ?? "",
    };
  }

  /**
   * Extract answers from an overseas address.
   * @param address - The overseas address from which to extract the answers.
   * @returns Partial AnswersOutput object containing the overseas address fields.
   */
  private static getAnswersFromOverseasAddress(
    address: OverseasAddress,
  ): Partial<AnswersOutput> {

    // I added the UK address fields because if addressLine1 and country are not set, then the Overseas page loads empty
    // and then won't let you continue as it wipes the mandatory fields when you click continue
    return {
      [AnswerKey.osAddressLine1]: address.addressLine1,
      [AnswerKey.osAddressLine2]: address.addressLine2,
      [AnswerKey.osAddressLine3]: address.addressLine3,
      [AnswerKey.osAddressLine4]: address.addressLine4,
      [AnswerKey.osCountry]: address.country,
      [AnswerKey.ukAddressLine1]: address.addressLine1,
      [AnswerKey.ukCountry]: address.country,
    };
  }

  /**
   * Extract answers from a UK address.
   * @param address - The UK address from which to extract the answers.
   * @returns Partial AnswersOutput object containing the UK address fields.
   */
  private static getAnswersFromUkAddress(
    address: UkAddress,
  ): Partial<AnswersOutput> {

    // see above comment about why the overseas address fields are also set here
    return {
      [AnswerKey.ukAddressLine1]: address.addressLine1,
      [AnswerKey.ukAddressLine2]: address.addressLine2,
      [AnswerKey.ukCountry]: address.country,
      [AnswerKey.ukCounty]: address.county,
      [AnswerKey.ukPostcode]: address.postcode,
      [AnswerKey.ukTownOrCity]: address.townOrCity,
      [AnswerKey.osAddressLine1]: address.addressLine1,
      [AnswerKey.osCountry]: address.country,
    };
  }

  /**
   * Extract overseas address fields from the answers.
   * @param answers - The answers from which to extract the address fields.
   * @param hasFixedAddress - boolean reused from above.
   * @returns Address object containing the overseas address fields.
   */
  private static getOverseasAddressFromAnswers(
    answers: AnswersOutput,
    hasFixedAddress: boolean,
  ): OverseasAddress {
    const countryName: string | undefined =
      answers[AnswerKey.osCountry];

    return {
      addressLine1: answers[AnswerKey.osAddressLine1] ?? "",
      addressLine2: answers[AnswerKey.osAddressLine2],
      addressLine3: answers[AnswerKey.osAddressLine3],
      addressLine4: answers[AnswerKey.osAddressLine4],
      country:
        hasFixedAddress && countryName
          ? mapCountryNameToIsoCode(countryName)
          : "",
    };
  }

  /**
   * Extract UK address fields from the answers.
   * @param answers - The answers from which to extract the address fields.
   * @param hasFixedAddress - boolean reused from above.
   * @returns Address object containing the UK address fields.
   */
  private static getUkAddressFromAnswers(
    answers: AnswersOutput,
    hasFixedAddress: boolean,
  ): UkAddress {
    const countryName: string | undefined = answers[AnswerKey.ukCountry];

    return {
      addressLine1: answers[AnswerKey.ukAddressLine1] ?? "",
      addressLine2: answers[AnswerKey.ukAddressLine2],
      country:
        hasFixedAddress && countryName
          ? mapCountryNameToIsoCode(countryName)
          : "",
      county: answers[AnswerKey.ukCounty],
      postcode: answers[AnswerKey.ukPostcode],
      townOrCity: answers[AnswerKey.ukTownOrCity],
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
