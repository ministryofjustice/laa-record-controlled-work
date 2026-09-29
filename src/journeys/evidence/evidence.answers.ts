export enum EvidenceAnswers {
  asylumSupportEvidence = "asylumSupportEvidence",
  benefitsInKindEvidence = "benefitsInKindEvidence",
  capitalEvidence = "capitalEvidence",
  childCareEvidence = "childCareEvidence",
  doYouHaveEvidence = "doYouHaveEvidence",
  employedEvidence = "employedEvidence",
  haveEvidenceOfCapital = "haveEvidenceOfCapital",
  haveEvidenceOfExpenditure = "haveEvidenceOfExpenditure",
  housingCostsEvidence = "housingCostsEvidence",
  incomeEvidence = "incomeEvidence",
  maintenanceEvidence = "maintenanceEvidence",
  moreDetailsForNoEvidence = "moreDetailsForNoEvidence",
  otherEvidence = "otherEvidence",
  reasonForNoEvidence = "reasonForNoEvidence",
  selfEmployedEvidence = "selfEmployedEvidence",
  stateBenefitsEvidence = "stateBenefitsEvidence",
  taxCreditsEvidence = "taxCreditsEvidence",
}

export const IncomeEvidence = [
  EvidenceAnswers.asylumSupportEvidence,
  EvidenceAnswers.benefitsInKindEvidence,
  EvidenceAnswers.employedEvidence,
  EvidenceAnswers.otherEvidence,
  EvidenceAnswers.selfEmployedEvidence,
  EvidenceAnswers.stateBenefitsEvidence,
  EvidenceAnswers.taxCreditsEvidence,
];

export const ExpenditureEvidence = [
  EvidenceAnswers.childCareEvidence,
  EvidenceAnswers.housingCostsEvidence,
  EvidenceAnswers.incomeEvidence,
  EvidenceAnswers.maintenanceEvidence,
];

export const CapitalEvidence = [EvidenceAnswers.capitalEvidence];
