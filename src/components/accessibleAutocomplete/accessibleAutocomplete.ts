import type {
  BlockDefinition,
  EvaluatedBlock,
  FieldBlockDefinition,
  ResolvableArray,
  ResolvableBoolean,
  ResolvableNumber,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

import { block as blockBuilder } from "@ministryofjustice/hmpps-forge/core/authoring";
import { buildNunjucksComponent } from "@ministryofjustice/hmpps-forge/express-nunjucks";

/**
 * Accessible Autocomplete wrapper component.
 * Full interface including form-engine discriminator properties.
 */
export interface AccessibleAutocomplete
  extends AccessibleAutocompleteProps, BlockDefinition {
  variant: "accessibleAutocomplete";
}

/**
 * Props for the AccessibleAutocomplete component.
 * @see https://github.com/alphagov/accessible-autocomplete
 */
export interface AccessibleAutocompleteProps {
  /**
   * Highlight the first option when the user types and receives results.
   * Pressing enter will select it.
   * @default false
   */
  autoselect?: ResolvableBoolean;

  /**
   * Confirm the selected option when the user clicks outside the component.
   * @default true
   */
  confirmOnBlur?: ResolvableBoolean;

  /**
   * Autocomplete data source.
   * Can be either:
   * - A flat array of strings: ['Option 1', 'Option 2', ...]
   * - A keyed object for dynamic filtering: { key1: ['...'], key2: ['...'] }
   * - A Data() expression that resolves to either of the above
   *
   * When using a keyed object, use `dataKeyFrom` to specify which element's
   * value determines the current key.
   */
  data: Record<string, ResolvableArray<string>> | ResolvableArray<string>;

  /**
   * CSS selector for an element whose value determines the data key.
   * Only used when `data` is a keyed object.
   *
   * @example '#area-of-need-input' - Gets value from element with this ID
   */
  dataKeyFrom?: ResolvableString;

  /**
   * How the menu should appear - inline or as an overlay.
   * @default 'inline'
   */
  displayMenu?: ResolvableString;

  /**
   * The field to enhance with autocomplete behaviour.
   * Typically a GovUKTextInput, but can be any field type.
   * The field will be wrapped in a div with data attributes for JS initialization.
   */
  field: FieldBlockDefinition;

  /**
   * Custom CSS classes for the hint element (appears when autoselect is true).
   * Defaults to inputClasses if not specified.
   * @default null
   */
  hintClasses?: ResolvableString;

  /**
   * Custom CSS classes to add to the input element.
   * @default null
   */
  inputClasses?: ResolvableString;

  /**
   * HTML attributes to set on the menu element.
   * Useful for accessibility, e.g. { 'aria-labelledby': 'my-label-id' }
   * Note: id, role and onMouseLeave cannot be overridden.
   */
  menuAttributes?: Record<string, ResolvableString>;

  /**
   * Custom CSS classes to add to the dropdown menu (ul element).
   * @default null
   */
  menuClasses?: ResolvableString;

  /**
   * Minimum number of characters before showing suggestions.
   * @default 2
   */
  minLength?: ResolvableNumber;

  /**
   * Show all values when the user clicks the input (like a dropdown).
   * Renders with a dropdown arrow to convey this behaviour.
   * @default false
   */
  showAllValues?: ResolvableBoolean;

  /**
   * Whether to show a "no results found" message when no options match.
   * @default false
   */
  showNoOptionsFound?: ResolvableBoolean;
}

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
    typeof value !== "string" &&
    typeof value !== "number" &&
    typeof value !== "boolean"
  ) {
    return "";
  }
  return `${name}="${String(value)}"`;
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
