export interface ClientAndCaseDetailsSection {
  heading: string;
  rows: ClientAndCaseDetailsSummaryRow[];
}

export interface ClientAndCaseDetailsSummaryRow {
  key: { text: string };
  value: { html: string } | { text: string };
}
