# Export feature

The export page loads an application from the RCW API, maps it to a view model, and renders HTML. It is served at `GET /cases/:applicationId/export` and requires authentication.

The service validates the API response and confirms the application belongs to the selected office. The handler prevents caching and renders the page. The page template displays the mapped values; it does not fetch or format application data itself.

## Add a section

Use `clientAndCaseDetails` as the example. A section consists of a mapper and a view-data type, with a formatter when the section needs reusable formatting.

1. Create `src/export/sections/<section-name>/<section-name>.types.ts`. Define the data the template needs. For a summary list, follow `ClientAndCaseDetailsSection` and `ClientAndCaseDetailsSummaryRow`.
2. Create the section mapper. Accept the validated `Application` model and return the section type. Put conditional row creation, translation lookups, and value selection in this mapper.
3. Add a formatter file if needed for shared conversions, such as date or address formatting. Keep it with the section.
4. Add the new section property to `ExportApplicationViewModel` in `export.types.ts`.
5. Call the section mapper from `toExportApplicationViewModel` in `export.mappers.ts` and return its result under the new property.
6. Create a Nunjucks partial under `src/views/export/sections/` and include it from `src/views/export/application.njk`. The partial should render the prepared section data, usually with the GOV.UK summary-list component.
7. Add translations for visible labels in `locales/en.json`. Use plain text values where possible. If a value contains HTML, escape any application data before returning it from the mapper.
8. Add mapper/formatter unit tests and update the export view tests to check the new section is rendered.

The existing client-and-case section is in `src/export/sections/clientAndCaseDetails/`; its template is `src/views/export/sections/client-and-case-details.njk`.

## Means assessment mapping boundary

The export link is presented in `src/journeys/declaration/steps/sign/sign.blocks.ts` after the normal journey reaches the declaration-sign step. The export route itself enforces authentication, API application validation, and selected-office ownership; it does not enforce means-assessment eligibility or `meansAssessmentRequired`. The link's workflow placement is not an API eligibility gate. Do not add a new access rule as part of section mapping.

Entered answers come from `eligibility.data`; saved calculations come from `eligibility.result.result_summary`. The mapper consumes `overall_result.result`, `overall_result.income_contribution`, and `overall_result.capital_contribution`; totals are `gross_income.combined_total_gross_income`, `disposable_income.combined_total_disposable_income`, and `capital.combined_assessed_capital`. A category is calculated when any proceeding type has a result other than `not_calculated`, matching CCQ's `CfeResult#calculated?`. The mapped result and threshold use the first proceeding type, matching CCQ's `result_for` and `raw_thresholds`; if its result is `not_calculated` but a later result is calculated, CCQ's summary treats the first result as `eligible` through its default case. A calculated category's total may be null. The mapper does not derive amounts or thresholds. CFE's `999999999999` upper-threshold sentinel is retained and separately marked as unlimited. Answer summaries have their own view-model collection so they can remain independently valid when calculation results are unavailable.

Expected mapper states use synthetic fixtures: `meansAssessmentRequired: false` returns no section even if stored answers/results say passported and eligible; a supported `eligible` or `contribution_required` result with a valid calculated category is ready, while missing, malformed, unknown, or overall-ineligible results are unavailable. An eligible result with no calculation categories is ready only when saved answers indicate passporting, asylum support with immigration/asylum, or the controlled-work under-18 no-means-test route (`passporting`, `immigration_or_asylum`, `asylum_support`, `client_age`, `controlled_legal_representation`, `aggregated_means`, `regular_income`, and `under_eighteen_assets`); its categories remain `not_calculated`. Zero and pence values are copied unchanged, and ordinary assessments with no calculated categories are unavailable.

## Means assessment modules

- `meansAssessment.mapper.ts` assembles the section and handles explicit omission.
- `answers/*.questions.ts` declare ordered questions, selectors, labels and domain-local relevance.
- `answers/answers.mapper.ts` maps saved answers into translated summaries.
- `answers/answers.formatter.ts` formats saved values as plain text.
- `calculations/calculations.mapper.ts` parses and maps saved calculation results independently of answer summaries.
- `calculations/calculations.zod.ts` defines calculation and exemption schemas with their inferred result types.
- Answer types live in `answers/answers.types.ts`; calculation types live in `calculations/calculations.types.ts`.
- Only section composition remains at the section root. Unit tests mirror module names and assert exported behaviour.

## Tests

Export tests live under `tests/unit/src/export/`, `tests/integration/export/`, and `tests/ui/tests/export.spec.ts`.