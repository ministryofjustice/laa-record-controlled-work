declare module "accessible-autocomplete" {
  export interface AccessibleAutocompleteOptions {
    autoselect?: boolean;
    confirmOnBlur?: boolean;
    defaultValue?: string;
    displayMenu?: "inline" | "overlay";
    element: HTMLElement;
    hintClasses?: null | string;
    id: string;
    inputClasses?: null | string;
    menuAttributes?: Record<string, string>;
    menuClasses?: null | string;
    minLength?: number;
    name?: string;
    showAllValues?: boolean;
    showNoOptionsFound?: boolean;
    source:
      | ((query: string, populateResults: (results: string[]) => void) => void)
      | string[];
  }

  export default function accessibleAutocomplete(
    options: AccessibleAutocompleteOptions,
  ): void;
}

declare module "govuk-frontend" {
  export function initAll(): void;
}

declare module "@ministryofjustice/frontend" {
  export function initAll(): void;
}
