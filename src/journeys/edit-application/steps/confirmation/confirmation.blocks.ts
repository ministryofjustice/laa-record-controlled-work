import { t, tt } from "#/lib/i18n.js";
import { H2 } from "#/lib/constants/headings.js";

import { GovUKBody, GovUKButton, GovUKHeading, GovUKPanel } from "@ministryofjustice/hmpps-forge/govuk-components";
import { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";
import { formatReferenceNumber } from "#/journeys/edit-application/steps/confirmation/confirmation.formatter.js";

export function confirmationPanel(): ReturnType<typeof GovUKPanel> {
  return GovUKPanel({
    titleText: t("journeys.editApplication.confirmation.panel.title"),
    html: formatReferenceNumber(),
  });
}

export function heading(): ReturnType<typeof GovUKHeading> {
  return GovUKHeading({
    text: t("journeys.editApplication.confirmation.nextHeading"),
    level: H2,
  });
}

export function statement(): HtmlBlock[] {
  const items = tt("journeys.editApplication.confirmation.nextList");
  return items.map((text) => GovUKBody({ text }));
};

export function returnButton(): ReturnType<typeof GovUKButton> {
  return GovUKButton({
    text: t("journeys.editApplication.confirmation.returnButton"),
  });
}