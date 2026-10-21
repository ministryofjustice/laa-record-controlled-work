import { z as zod } from "zod";

export const EvidenceAnswers = zod
  .object({
    doYouHaveEvidence: zod.enum(["no", "yes"]),
    reasonForNoEvidence: zod.enum(["adviceOverPhone", "notPossibleBeforeStart", "personalCircumstances"]),
    asylumSupportEvidence: zod.array(zod.string()).optional(),
    benefitsInKindEvidence: zod.array(zod.string()).optional(),
    capitalEvidence: zod.array(zod.string()).optional(),
    childCareEvidence: zod.array(zod.string()).optional(),
    employedEvidence: zod.array(zod.string()).optional(),
    housingCostsEvidence: zod.array(zod.string()).optional(),
    incomeEvidence: zod.array(zod.string()).optional(),
    maintenanceEvidence: zod.array(zod.string()).optional(),
    moreDetailsForNoEvidence: zod.string().optional(),
    otherEvidence: zod.array(zod.string()).optional(),
    selfEmployedEvidence: zod.array(zod.string()).optional(),
    stateBenefitsEvidence: zod.array(zod.string()).optional(),
    taxCreditsEvidence: zod.array(zod.string()).optional(),
    haveEvidenceOfCapital: zod.enum(["no", "yes"]).optional(),
    haveEvidenceOfExpenditure: zod.enum(["no", "yes"]).optional()
  });

export type EvidenceAnswersInput = zod.input<typeof EvidenceAnswers>;
export type EvidenceAnswersOutput = zod.output<typeof EvidenceAnswers>;
