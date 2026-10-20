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

const yesNo = (key: AnswerKey): PredicateExpr =>
  Answer(key).match(Condition.Array.IsIn(["yes", "no"]));
const required = (key: AnswerKey): PredicateExpr =>
  Answer(key).match(Condition.IsRequired());

/**
 * Defines visibility and completeness for the exposed summary fields.
 * @returns The rules for each summary field.
 */
export function checkAnswersModel(): Record<SummaryFieldKey, SummaryField> {
  const isPrivateLaw = Answer(AnswerKey.familyLawClassification).match(
    Condition.Equals("private"),
  );
  const isPublicLaw = Answer(AnswerKey.familyLawClassification).match(
    Condition.Equals("public"),
  );

  const isYesSameMatter = Answer(AnswerKey.legalAidBefore).match(
    Condition.Equals("yesSameMatter"),
  );
  const isRecentLegalAid = and(
    isYesSameMatter,
    Answer(AnswerKey.legalAidLast6Months).match(Condition.Equals("yes")),
  );

  const isInjunction = and(
    isPrivateLaw,
    Answer(AnswerKey.needsAdviceOnEUOrInternationalMaintenance).match(
      Condition.Equals("no"),
    ),
  );
  const hasFixedAddress = Answer(AnswerKey.haveAHomeAddress).match(
    Condition.Equals("yes"),
  );
  const isUkAddress = Answer(AnswerKey.ukCountry).match(
    Condition.Equals("United Kingdom"),
  );

  return {
    address: field({
      completeWhen: or(
        not(hasFixedAddress),
        and(
          isUkAddress,
          required(AnswerKey.ukAddressLine1),
          required(AnswerKey.ukTownOrCity),
          required(AnswerKey.ukPostcode),
        ),
        and(
          not(isUkAddress),
          required(AnswerKey.osAddressLine1),
          required(AnswerKey.osCountry),
        ),
      ),
      visibleWhen: true,
    }),
    careProceedingsStarted: field({
      completeWhen: yesNo(AnswerKey.careProceedingsStarted),
      visibleWhen: isPublicLaw,
    }),
    dateOfBirth: field({
      completeWhen: required(AnswerKey.dateOfBirth),
      visibleWhen: true,
    }),
    ecf: field({
      completeWhen: yesNo(AnswerKey.ecf),
      visibleWhen: true,
    }),
    familyLawClassification: field({
      completeWhen: or(isPrivateLaw, isPublicLaw),
      visibleWhen: true,
    }),
    firstName: field({
      completeWhen: required(AnswerKey.firstName),
      visibleWhen: true,
    }),
    haveAHomeAddress: field({
      completeWhen: yesNo(AnswerKey.haveAHomeAddress),
      visibleWhen: true,
    }),
    lastName: field({
      completeWhen: required(AnswerKey.lastName),
      visibleWhen: true,
    }),
    legalAidBefore: field({
      completeWhen: Answer(AnswerKey.legalAidBefore).match(
        Condition.Array.IsIn(["no", "yesSameMatter", "yesDifferentMatter"]),
      ),
      visibleWhen: true,
    }),
    legalAidLast6Months: field({
      completeWhen: yesNo(AnswerKey.legalAidLast6Months),
      visibleWhen: isYesSameMatter,
    }),
    needsAdviceOnEUOrInternationalMaintenance: field({
      completeWhen: yesNo(AnswerKey.needsAdviceOnEUOrInternationalMaintenance),
      visibleWhen: isPrivateLaw,
    }),
    needsProtectiveInjunction: field({
      completeWhen: yesNo(AnswerKey.needsProtectiveInjunction),
      visibleWhen: isInjunction,
    }),
    niNumber: field({
      // field is completed when both conditions are true
      completeWhen: and(
        yesNo(AnswerKey.hasNINumber),
        // AND
        or(
          Answer(AnswerKey.hasNINumber).match(Condition.Equals("no")),
          // OR
          required(AnswerKey.niNumber),
        ),
      ),
      visibleWhen: true,
    }),
    reasonForYes: field({
      completeWhen: required(AnswerKey.reasonForYes),
      visibleWhen: isRecentLegalAid,
    }),
  };
}

/**
 * Pairs a field's completeness rule with its visibility rule.
 * @param rules The field's completeness and visibility rules.
 * @param rules.completeWhen Whether the field has all required answers.
 * @param rules.visibleWhen Whether the field applies to the current answers.
 * @returns The field's summary rules.
 */
function field({ completeWhen, visibleWhen }: SummaryField): SummaryField {
  return { completeWhen, visibleWhen };
}
