import type { Application as ApplicationSchema } from "#/api/clients/rcw/model/application.zod.gen.js";
import type { CreateApplicationRequestBody } from "#/api/clients/rcw/model/createApplicationRequestBody.zod.gen.js";
import type { CreateScopingQuestions } from "#/api/clients/rcw/model/createScopingQuestions.zod.gen.js";
import type { AnswersOutput } from "#/journeys/create-application/data/answers.zod.js";

import { PriorLegalAid } from "#/api/clients/rcw/model/priorLegalAid.zod.gen.js";
import { AnswerKey } from "#/journeys/AnswerKey.enum.js";
import {
  mapCountryNameToIsoCode,
  mapIsoCodeToCountryName,
} from "#/lib/countries.js";

interface Application {
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  addressLine4?: string;
  country?: string;
  county?: string;
  dateOfBirth: string;
  firstName: string;
  hasFixedAddress: boolean;
  lastName: string;
  legalAidLast6Months?: boolean;
  niNumber?: string;
  postcode?: string;
  providerOfficeCode: string;
  reasonForReapplication?: string;
  scopingQuestions: CreateScopingQuestions;
  townOrCity?: string;
}

type ApplicationAddress = NonNullable<
  ApplicationSchema["clientDetails"]["address"]
>;

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
  postCode?: string;
  townOrCity?: string;
}

/**
 * Data transfer object for an application.
 * @param application - The application data to be transferred.
 */
export class ApplicationDto {
  public addressLine1?: string;
  public addressLine2?: string;
  public addressLine3?: string;
  public addressLine4?: string;
  public country?: string;
  public county?: string;
  public dateOfBirth = "";
  public firstName = "";
  public hasFixedAddress = false;
  public lastName = "";
  public legalAidLast6Months?: boolean;
  public niNumber?: string;
  public postCode?: string;
  public providerOfficeCode = "";
  public reasonForReapplication?: string;
  public scopingQuestions!: CreateScopingQuestions;
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

    const address = hasFixedAddress ? this.getAddressFromAnswers(answers) : {};

    return new ApplicationDto({
      ...address,
      dateOfBirth: answers.dateOfBirth,
      firstName: answers.firstName,
      hasFixedAddress,
      lastName: answers.lastName,
      legalAidLast6Months: answers.legalAidLast6Months === "yes",
      niNumber: answers.niNumber,
      providerOfficeCode,
      reasonForReapplication: answers.reasonForYes,
      scopingQuestions: {
        familyLawClassification: answers.familyLawClassification,
        priorLegalAid: answers.legalAidBefore,
      },
    });
  }

  /**
   * Set the address fields based off whether the address is UK or overseas.
   * @param answers - The answers from which to extract the address fields.
   * @returns Address object containing the address fields.
   */
  public static getAddressFromAnswers(
    answers: AnswersOutput,
  ): OverseasAddress | UkAddress {
    const isUkAddress = answers[AnswerKey.ukCountry] === "United Kingdom";

    return isUkAddress
      ? this.getUkAddressFromAnswers(answers)
      : this.getOverseasAddressFromAnswers(answers);
  }

  /**
   * Creates answers output from the provided address.
   * @param application - The application from which to extract the address fields.
   * @returns Partial AnswersOutput instance containing the address fields.
   */
  public static getAnswersFromAddress(
    application: ApplicationSchema,
  ): Partial<AnswersOutput> {
    const { address } = application.clientDetails;

    if (!address) {
      return {};
    }

    return address.country === "GB"
      ? this.getAnswersFromUkAddress(address)
      : this.getAnswersFromOverseasAddress(address);
  }

  /**
   * Creates an answers output instance from the provided application.
   * @param application - The application from which to create the answers output instance.
   * @returns Partial AnswersOutput instance.
   */
  public static toAnswers(
    application: ApplicationSchema,
  ): Partial<AnswersOutput> {
    const answers: Partial<AnswersOutput> = {
      ...this.getClientDetailsAnswers(application),
      ...this.getScopingAnswers(application),
    };

    if (typeof application.ecfFlag === "boolean") {
      answers[AnswerKey.ecf] = application.ecfFlag ? "yes" : "no";
    }

    return answers;
  }

  /**
   * Extract answers from an overseas address.
   * @param address - The overseas address from which to extract the answers.
   * @returns Partial AnswersOutput object containing the overseas address fields.
   */
  private static getAnswersFromOverseasAddress(
    address: ApplicationAddress,
  ): Partial<AnswersOutput> {
    // I added the UK address fields because if addressLine1 and country are not set, then the Overseas page loads empty
    // and then won't let you continue as it wipes the mandatory fields when you click continue
    return {
      [AnswerKey.osAddressLine1]: address.addressLine1,
      [AnswerKey.osAddressLine2]: address.addressLine2 ?? undefined,
      [AnswerKey.osAddressLine3]: address.addressLine3 ?? undefined,
      [AnswerKey.osAddressLine4]: address.addressLine4 ?? undefined,
      [AnswerKey.osCountry]: mapIsoCodeToCountryName(address.country),
    };
  }

  /**
   * Extract answers from a UK address.
   * @param address - The UK address from which to extract the answers.
   * @returns Partial AnswersOutput object containing the UK address fields.
   */
  private static getAnswersFromUkAddress(
    address: ApplicationAddress,
  ): Partial<AnswersOutput> {
    // see above comment about why the overseas address fields are also set here
    return {
      [AnswerKey.ukAddressLine1]: address.addressLine1,
      [AnswerKey.ukAddressLine2]: address.addressLine2 ?? undefined,
      [AnswerKey.ukCountry]: mapIsoCodeToCountryName(address.country),
      [AnswerKey.ukCounty]: address.county ?? undefined,
      [AnswerKey.ukPostcode]: address.postCode ?? undefined,
      [AnswerKey.ukTownOrCity]: address.townOrCity ?? undefined,
    };
  }

  /**
   * Maps known client and active address details to journey answers.
   * @param application - The application containing client details.
   * @returns Partial answers from the client details.
   */
  private static getClientDetailsAnswers(
    application: ApplicationSchema,
  ): Partial<AnswersOutput> {
    const { clientDetails } = application;

    const addressAnswers = clientDetails.hasFixedAddress
      ? this.getAnswersFromAddress(application)
      : {};

    return {
      ...addressAnswers,
      [AnswerKey.dateOfBirth]: clientDetails.dateOfBirth,
      [AnswerKey.firstName]: clientDetails.firstName,
      [AnswerKey.hasNINumber]: clientDetails.niNumber ? "yes" : "no",
      [AnswerKey.haveAHomeAddress]: clientDetails.hasFixedAddress
        ? "yes"
        : "no",
      [AnswerKey.lastName]: clientDetails.lastName,
      [AnswerKey.niNumber]: clientDetails.niNumber ?? "",
    };
  }

  /**
   * Extract overseas address fields from the answers.
   * @param answers - The answers from which to extract the address fields.
   * @returns Address object containing the overseas address fields.
   */
  private static getOverseasAddressFromAnswers(
    answers: AnswersOutput,
  ): OverseasAddress {
    const countryName: string | undefined = answers[AnswerKey.osCountry];

    return {
      addressLine1: answers[AnswerKey.osAddressLine1] ?? "",
      addressLine2: answers[AnswerKey.osAddressLine2],
      addressLine3: answers[AnswerKey.osAddressLine3],
      addressLine4: answers[AnswerKey.osAddressLine4],
      country: countryName ? mapCountryNameToIsoCode(countryName) : "",
    };
  }

  /**
   * Maps available scoping answers and same-matter follow-up details.
   * @param application - The application containing scoping details.
   * @returns Partial answers from scoping details.
   */
  private static getScopingAnswers(
    application: ApplicationSchema,
  ): Partial<AnswersOutput> {
    const answers: Partial<AnswersOutput> = {};
    const { reasonForReapplication, scopingQuestions } = application;

    const familyLawClassification = scopingQuestions?.familyLawClassification;
    if (familyLawClassification !== undefined) {
      answers[AnswerKey.familyLawClassification] = familyLawClassification;
    }

    const priorLegalAid = scopingQuestions?.priorLegalAid;
    if (priorLegalAid !== undefined) {
      answers[AnswerKey.legalAidBefore] = priorLegalAid;

      if (priorLegalAid === PriorLegalAid.enum.yesSameMatter) {
        answers[AnswerKey.legalAidLast6Months] = reasonForReapplication
          ? "yes"
          : "no";
        answers[AnswerKey.reasonForYes] = reasonForReapplication ?? "";
      }
    }

    return answers;
  }

  /**
   * Extract UK address fields from the answers.
   * @param answers - The answers from which to extract the address fields.
   * @returns Address object containing the UK address fields.
   */
  private static getUkAddressFromAnswers(answers: AnswersOutput): UkAddress {
    const countryName: string | undefined = answers[AnswerKey.ukCountry];

    return {
      addressLine1: answers[AnswerKey.ukAddressLine1] ?? "",
      addressLine2: answers[AnswerKey.ukAddressLine2],
      country: countryName ? mapCountryNameToIsoCode(countryName) : "",
      county: answers[AnswerKey.ukCounty],
      postCode: answers[AnswerKey.ukPostcode],
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
        addressLine1: this.addressLine1 ?? "",
        addressLine2: this.addressLine2,
        addressLine3: this.addressLine3,
        addressLine4: this.addressLine4,
        country: this.country ?? "",
        county: this.county,
        postCode: this.postCode,
        townOrCity: this.townOrCity,
      };
    }

    return {
      clientDetails,
      legalAidLast6Months: this.legalAidLast6Months,
      providerOfficeCode: this.providerOfficeCode,
      reasonForReapplication: this.reasonForReapplication,
      scopingQuestions: this.scopingQuestions,
    };
  }
}
