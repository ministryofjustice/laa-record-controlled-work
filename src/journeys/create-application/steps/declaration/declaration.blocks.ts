import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { GovUKBody } from "@ministryofjustice/hmpps-forge/govuk-components";

export const body = (): HtmlBlock =>
  GovUKBody({
    classes: "govuk-body",
    // TODO - this should be in the i18n file, but it contains HTML which is not supported by the i18n library
    text: 'By continuing, you agree that:<br><ul class="govuk-list govuk-list--bullet govuk-!-margin-bottom-6"><li>your client has instructed you, the provider, to act on their behalf</li><li>your client has read the <a target="_blank" href="/privacy-policy">LAA privacy policy (opens in a new window or tab)</a></li><li>you\'ll give complete and correct information</li></ul>',
  });
