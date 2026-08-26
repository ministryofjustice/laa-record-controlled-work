import {
  GovUKBody,
  GovUKButton,
  GovUKHeading,
  GovUKPanel,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { formatReferenceNumber } from "#/journeys/edit-application/steps/confirmation/confirmation.formatter.js";
import { H2 } from "#/lib/constants/headings.js";
import { t, tt } from "#/lib/i18n.js";

/**
 *  generate the confirmation panel for the edit application journey.
 *  @returns GovUKPanel component with the reference number and title text for the confirmation step.
 */
export function confirmationPanel(): GovUKPanel {
  return GovUKPanel({
    html: formatReferenceNumber(),
    titleText: t("journeys.editApplication.confirmation.panel.title"),
  });
}

/**
 *  generate the heading for the confirmation step of the edit application journey.
 *  @returns GovUKHeading component with the heading text for the confirmation step.
 */
export function heading(): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    level: H2,
    text: t("journeys.editApplication.confirmation.nextHeading"),
  });
}

/**
 *. generate the return button for the confirmation step of the edit application journey.
 *  @returns GovUKButton component with the text for the return button.
 */
export function returnButton(): GovUKButton {
  return GovUKButton({
    text: t("journeys.editApplication.confirmation.returnButton"),
  });
}

/**
 * generate the list of statements for the confirmation step of the edit application journey.
 *  @returns array of GovUKBody components with the text for each statement.
 */
export function statement(): Array<ReturnType<typeof GovUKBody>> {
  const items = tt("journeys.editApplication.confirmation.nextList");
  return items.map((text) => GovUKBody({ text }));
}
