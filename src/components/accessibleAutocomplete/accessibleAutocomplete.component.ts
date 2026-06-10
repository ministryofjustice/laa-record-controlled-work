import type {
  EvaluatedBlock,
  FieldBlockDefinition,
} from "@ministryofjustice/hmpps-forge/core/components";

import { block as blockBuilder } from "@ministryofjustice/hmpps-forge/core/authoring";
import { buildNunjucksComponent } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import type {
  AccessibleAutocomplete,
  AccessibleAutocompleteProps,
} from "./accessibleAutocomplete.types.js";

/**
 * Builds the HTML attribute string for the accessible-autocomplete-wrapper element.
 *
 * @param block - The evaluated AccessibleAutocomplete block
 * @param dataId - The id of the JSON data script tag
 * @param defaultValue - The pre-filled value to set on the autocomplete input
 * @returns A space-separated string of HTML attributes
 */
function buildWrapperAttrs(
  block: EvaluatedBlock<AccessibleAutocomplete>,
  dataId: string,
  defaultValue: unknown,
): string {
  return [
    'class="accessible-autocomplete-wrapper"',
    `data-autocomplete-source="${dataId}"`,
    optionalAttr("data-autocomplete-default-value", defaultValue),
    optionalAttr("data-autocomplete-source-key-from", block.dataKeyFrom),
    optionalAttr("data-autocomplete-min-length", block.minLength),
    optionalAttr("data-autocomplete-show-no-options", block.showNoOptionsFound),
    optionalAttr("data-autocomplete-menu-classes", block.menuClasses),
    optionalAttr("data-autocomplete-input-classes", block.inputClasses),
    optionalAttr("data-autocomplete-hint-classes", block.hintClasses),
    optionalAttr("data-autocomplete-autoselect", block.autoselect),
    optionalAttr("data-autocomplete-confirm-on-blur", block.confirmOnBlur),
    optionalAttr("data-autocomplete-display-menu", block.displayMenu),
    optionalAttr("data-autocomplete-show-all-values", block.showAllValues),
    block.menuAttributes !== undefined
      ? `data-autocomplete-menu-attributes='${JSON.stringify(block.menuAttributes)}'`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Returns an HTML attribute string if value is a defined primitive, otherwise an empty string.
 *
 * @param name - The attribute name
 * @param value - The attribute value; non-primitive values are ignored
 * @returns An attribute string like `name="value"`, or an empty string
 */
function optionalAttr(name: string, value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return `${name}="${String(value)}"`;
  }
  return "";
}

/**
 * Renders the AccessibleAutocomplete wrapper component.
 *
 * Outputs:
 * 1. A script tag with type="application/json" containing the autocomplete data
 * 2. A wrapper div with data attributes around the field's HTML
 */
export const accessibleAutocomplete =
  buildNunjucksComponent<AccessibleAutocomplete>(
    "accessibleAutocomplete",
    (block: EvaluatedBlock<AccessibleAutocomplete>): string => {
      const rawBlock = block.field.block;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- Forge resolves all expressions before calling render; value and defaultValue exist at runtime
      const fieldBlock = rawBlock as unknown as FieldBlockDefinition & {
        defaultValue?: unknown;
        value?: unknown;
      };
      const fieldCode =
        typeof fieldBlock.code === "string"
          ? fieldBlock.code
          : "autocomplete-field";
      const dataId = `autocomplete-data-${fieldCode}`;
      const dataScript = `<script type="application/json" id="${dataId}" data-qa="${dataId}">${JSON.stringify(block.data)}</script>`;
      const defaultValue = fieldBlock.value ?? fieldBlock.defaultValue;
      const wrapperAttrs = buildWrapperAttrs(block, dataId, defaultValue);
      return `${dataScript}\n<accessible-autocomplete-wrapper ${wrapperAttrs}>\n${block.field.html}\n</accessible-autocomplete-wrapper>`;
    },
  );

/**
 * Creates an accessible autocomplete wrapper around a field.
 *
 * @param props - The autocomplete configuration options
 * @returns An AccessibleAutocomplete block definition
 * @example
 * ```typescript
 * AccessibleAutocomplete({
 *   field: GovUKTextInput({ code: 'goal', label: 'Select a goal' }),
 *   data: Data('goals'),
 * })
 * ```
 */
export function AccessibleAutocomplete(
  props: AccessibleAutocompleteProps,
): AccessibleAutocomplete {
  return blockBuilder<AccessibleAutocomplete>({
    ...props,
    variant: "accessibleAutocomplete",
  });
}
