import {
  redirect,
  step,
  submit,
} from "@ministryofjustice/hmpps-forge/core/authoring";
import {
  GovUKBackLink,
  GovUKBody,
  GovUKButton,
  GovUKHeading,
} from "@ministryofjustice/hmpps-forge/govuk-components";

import { H1 } from "#/lib/constants/headings.js";
import { t } from "#/lib/i18n.js";

export const declarationStep = (journeyCode: string): ReturnType<typeof step> =>
  step({
    blocks: [
      GovUKBackLink({
        href: "/",
      }),
      GovUKHeading({
        level: H1,
        text: t("journeys.createApplication.declaration.title"),
      }),
      GovUKBody({
        classes: "govuk-body",
        text: 'By continuing, you agree that:<br><ul class="govuk-list govuk-list--bullet govuk-!-margin-bottom-6"><li>your client has instructed you, the provider, to act on their behalf</li><li>your client has read the <a target="_blank" href="/privacy-policy">LAA privacy policy (opens in a new window or tab)</a></li><li>you\'ll give complete and correct information</li></ul>',
      }),
      GovUKButton({
        text: t("journeys.createApplication.declaration.continue"),
      }),
    ],
    onSubmission: [
      submit({
        onAlways: {
          next: [redirect({ goto: "ecf" })],
        },
        validate: false,
      }),
    ],
    path: "/provider-declaration",
    reachability: { entryWhen: true },
    title: t("journeys.createApplication.declaration.title"),
  });
