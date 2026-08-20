import { z as zod } from "zod";

export const Answers = zod
  .object({
    addressLine1: zod.string().optional(),
    addressLine2: zod.string().optional(),
    addressLine3: zod.string().optional(),
    addressLine4: zod.string().optional(),
    country: zod.string().optional(),
    county: zod.string().optional(),
    dateOfBirth: zod.string(),
    ecf: zod.string(),
    firstName: zod.string(),
    hasNINumber: zod.string(),
    haveAHomeAddress: zod.string(),
    lastName: zod.string(),
    legalAidBefore: zod.string(),
    legalAidLast6Months: zod.string().optional(),
    niNumber: zod.string().optional(),
    postcode: zod.string().optional(),
    reasonForYes: zod.string().optional(),
    townOrCity: zod.string().optional(),
  })
  .superRefine((answers, context) => {
    if (answers.haveAHomeAddress !== "yes") {
      return;
    }

    if (!answers.addressLine1) {
      context.addIssue({
        code: "custom",
        message: "addressLine1 is required when haveAHomeAddress is yes",
        path: ["addressLine1"],
      });
    }

    if (!answers.country) {
      context.addIssue({
        code: "custom",
        message: "country is required when haveAHomeAddress is yes",
        path: ["country"],
      });
    }
  });

export type Answers = zod.input<typeof Answers>;
export type AnswersOutput = zod.output<typeof Answers>;
