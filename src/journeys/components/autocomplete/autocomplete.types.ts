import type {
  BlockDefinition,
  FieldBlockDefinition,
  ResolvableArray,
  ResolvableBoolean,
  ResolvableNumber,
  ResolvableString,
} from "@ministryofjustice/hmpps-forge/core/components";

/**
 * Accessible Autocomplete block definition including Forge discriminator.
 */
export interface Autocomplete extends AutocompleteProps, BlockDefinition {
  variant: "autocomplete";
}

/**
 * Props for the Autocomplete component.
 * @see https://github.com/alphagov/accessible-autocomplete
 */
export interface AutocompleteProps {
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

export type EvaluatedField = FieldBlockDefinition & {
  defaultValue?: unknown;
  value?: unknown;
};
