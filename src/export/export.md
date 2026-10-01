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

## Tests

Export tests live under `tests/unit/src/export/`, `tests/integration/export/`, and `tests/ui/tests/export.spec.ts`.