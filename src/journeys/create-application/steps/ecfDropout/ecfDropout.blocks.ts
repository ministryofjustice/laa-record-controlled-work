import type { HtmlBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { GovUKBody } from "@ministryofjustice/hmpps-forge/govuk-components";

// TODO - this should be in the i18n file, but it contains HTML which is not supported by the i18n library

/**
 * Creates a body block with instructions to complete ECF application forms.
 *
 * @returns {HtmlBlock} A GovUK body component with ECF form completion instructions
 */
export function ecfDroupoutBody(): HtmlBlock {
  return GovUKBody({
    text: 'Continue to complete the <a href="/government/publications/legal-aid-exceptional-case-funding-form-and-guidance">ECF application form CIV ECF 1</a> and <a href="/government/publications/cw1-financial-eligibility-for-legal-aid-clients">form CW1</a> for your client.',
  });
}

/**
 * Creates a body block with instructions for submitting completed ECF forms.
 *
 * @returns {HtmlBlock} A GovUK body component with form submission email instructions
 */
export function submitFormsBody(): HtmlBlock {
  return GovUKBody({
    text: 'Send completed forms to: <a href="mailto:contactECC@justice.gov.uk">contactECC@justice.gov.uk</a>',
  });
}
