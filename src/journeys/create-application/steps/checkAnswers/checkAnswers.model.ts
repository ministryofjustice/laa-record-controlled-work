import {
  and,
  Answer,
  Condition,
  not,
  or,
  type PredicateExpr,
} from "@ministryofjustice/hmpps-forge/core/authoring";

import { AnswerKey } from "#/journeys/AnswerKey.enum.js";

interface SummaryField {
  completeWhen: PredicateExpr;
  visibleWhen: PredicateExpr | true;
}

type SummaryFieldKey =
  | "address"
  | AnswerKey.careProceedingsStarted
  | AnswerKey.dateOfBirth
  | AnswerKey.ecf
  | AnswerKey.familyLawClassification
  | AnswerKey.firstName
  | AnswerKey.haveAHomeAddress
  | AnswerKey.lastName
  | AnswerKey.legalAidBefore
  | AnswerKey.legalAidLast6Months
  | AnswerKey.needsAdviceOnEUOrInternationalMaintenance
  | AnswerKey.needsProtectiveInjunction
  | AnswerKey.niNumber
  | AnswerKey.reasonForYes;

/**
 * Requires complete answers only for visible summary fields.
 * @returns The condition for submitting checked answers.
 */
export function checkAnswersComplete(): PredicateExpr {
  return and(
    Object.values(checkAnswersModel()).map(({ completeWhen, visibleWhen }) =>
      visibleWhen === true ? completeWhen : or(not(visibleWhen), completeWhen),
    ),
  );
}

/**
 * Defines visibility and completeness for the exposed summary fields.
 * @returns The rules for each summary field.
 */
export function checkAnswersModel(): Record<SummaryFieldKey, SummaryField> {
  const privateLaw = Answer(AnswerKey.familyLawClassification).match(
    Condition.Equals("private"),
  );
  const publicLaw = Answer(AnswerKey.familyLawClassification).match(
    Condition.Equals("public"),
  );
  const yesSameMatter = Answer(AnswerKey.legalAidBefore).match(
    Condition.Equals("yesSameMatter"),
  );
  const recentLegalAid = and(
    yesSameMatter,
    Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("yes")),
  );
  const injunction = and(
    privateLaw,
    Answer(AnswerKey.needsAdviceOnEUOrInternationalMaintenance).match(
      Condition.Equals("no"),
    ),
  );
  const fixedAddress = Answer(AnswerKey.haveAHomeAddress).match(
    Condition.Equals("yes"),
  );
  const ukAddress = Answer(AnswerKey.ukCountry).match(
    Condition.Equals("United Kingdom"),
  );
  const yesNo = (key: AnswerKey): PredicateExpr =>
    Answer(key).match(Condition.Array.IsIn(["yes", "no"]));
  const required = (key: AnswerKey): PredicateExpr =>
    Answer(key).match(Condition.IsRequired());

  return {
    address: field(
      or(
        not(fixedAddress),
        and(
          ukAddress,
          required(AnswerKey.ukAddressLine1),
          required(AnswerKey.ukTownOrCity),
          required(AnswerKey.ukPostcode),
        ),
        and(
          not(ukAddress),
          required(AnswerKey.osAddressLine1),
          required(AnswerKey.osCountry),
        ),
      ),
    ),
    careProceedingsStarted: field(
      yesNo(AnswerKey.careProceedingsStarted),
      publicLaw,
    ),
    dateOfBirth: field(required(AnswerKey.dateOfBirth)),
    ecf: field(yesNo(AnswerKey.ecf)),
    familyLawClassification: field(
      Answer(AnswerKey.familyLawClassification).match(
        Condition.Array.IsIn(["private", "public"]),
      ),
    ),
    firstName: field(required(AnswerKey.firstName)),
    haveAHomeAddress: field(yesNo(AnswerKey.haveAHomeAddress)),
    lastName: field(required(AnswerKey.lastName)),
    legalAidBefore: field(
      Answer(AnswerKey.legalAidBefore).match(
        Condition.Array.IsIn(["no", "yesSameMatter", "yesDifferentMatter"]),
      ),
    ),
    legalAidLast6Months: field(
      yesNo(AnswerKey.legalAidLast6Months),
      yesSameMatter,
    ),
    needsAdviceOnEUOrInternationalMaintenance: field(
      yesNo(AnswerKey.needsAdviceOnEUOrInternationalMaintenance),
      privateLaw,
    ),
    needsProtectiveInjunction: field(
      yesNo(AnswerKey.needsProtectiveInjunction),
      injunction,
    ),
    niNumber: field(
      and(
        yesNo(AnswerKey.hasNINumber),
        or(
          Answer(AnswerKey.hasNINumber).match(Condition.Equals("no")),
          required(AnswerKey.niNumber),
        ),
      ),
    ),
    reasonForYes: field(required(AnswerKey.reasonForYes), recentLegalAid),
  };
}

/**
 * Pairs a field's completeness rule with its visibility rule.
 * @param completeWhen Whether the field has all required answers.
 * @param visibleWhen Whether the field applies to the current answers.
 * @returns The field's summary rules.
 */
function field(
  completeWhen: PredicateExpr,
  visibleWhen: PredicateExpr | true = true,
): SummaryField {
  return { completeWhen, visibleWhen };
}
