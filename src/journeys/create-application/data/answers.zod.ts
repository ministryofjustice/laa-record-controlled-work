import { z as zod } from "zod";

export const Answers = zod
  .object({
    osAddressLine1: zod.string().optional(),
    osAddressLine2: zod.string().optional(),
    osAddressLine3: zod.string().optional(),
    osAddressLine4: zod.string().optional(),
    osCountry: zod.string().optional(),
    ukCountry: zod.string().optional(),
    ukAddressLine1: zod.string().optional(),
    ukAddressLine2: zod.string().optional(),
    ukCounty: zod.string().optional(),
    dateOfBirth: zod.string(),
    ecf: zod.string(),
    firstName: zod.string(),
    hasNINumber: zod.string(),
    haveAHomeAddress: zod.string(),
    lastName: zod.string(),
    legalAidBefore: zod.string(),
    legalAidLast6Months: zod.string().optional(),
    niNumber: zod.string().optional(),
    ukPostcode: zod.string().optional(),
    reasonForYes: zod.string().optional(),
    ukTownOrCity: zod.string().optional(),
  })
  .superRefine((answers, context) => {
    if (answers.haveAHomeAddress !== "yes") {
      return;
    }

    if (!answers.ukAddressLine1 && !answers.osAddressLine1) {
      context.addIssue({
        code: "custom",
        message: "addressLine1 is required when haveAHomeAddress is yes",
        path: ["ukAddressLine1", "osAddressLine1"],
      });
    }

    if (!answers.ukCountry && !answers.osCountry) {
      context.addIssue({
        code: "custom",
        message: "country is required when haveAHomeAddress is yes",
        path: ["ukCountry", "osCountry"],
      });
    }
  });

export type Answers = zod.input<typeof Answers>;
export type AnswersOutput = zod.output<typeof Answers>;
