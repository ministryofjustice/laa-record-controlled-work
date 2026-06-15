import type { EvaluatedBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { block as blockBuilder } from "@ministryofjustice/hmpps-forge/core/authoring";
import { buildNunjucksComponent } from "@ministryofjustice/hmpps-forge/express-nunjucks";

import type {
  Autocomplete,
  AutocompleteProps,
  EvaluatedField,
} from "./autocomplete.types.js";

/**
 * Builds the HTML attribute string for the autocomplete-wrapper element.
 *
 * @param block - The evaluated Autocomplete block
 * @param dataId - The id of the JSON data script tag
 * @param defaultValue - The pre-filled value to set on the autocomplete input
 * @returns A space-separated string of HTML attributes
 */
function buildWrapperAttributes(
  block: EvaluatedBlock<Autocomplete>,
  dataId: string,
  defaultValue: unknown,
): string {
  const optionalAttributes: Array<[string, unknown]> = [
    ["data-autocomplete-source-key-from", block.dataKeyFrom],
    ["data-autocomplete-min-length", block.minLength],
    ["data-autocomplete-show-no-options", block.showNoOptionsFound],
    ["data-autocomplete-menu-classes", block.menuClasses],
    ["data-autocomplete-input-classes", block.inputClasses],
    ["data-autocomplete-hint-classes", block.hintClasses],
    ["data-autocomplete-autoselect", block.autoselect],
    ["data-autocomplete-confirm-on-blur", block.confirmOnBlur],
    ["data-autocomplete-display-menu", block.displayMenu],
    ["data-autocomplete-show-all-values", block.showAllValues],
    ["data-autocomplete-default-value", defaultValue],
  ];
  const menuAttributes =
    block.menuAttributes !== undefined
      ? `data-autocomplete-menu-attributes='${JSON.stringify(block.menuAttributes)}'`
      : "";

  return [
    'class="autocomplete-wrapper"',
    `data-autocomplete-source="${dataId}"`,
    menuAttributes,
    ...optionalAttributes.map(([name, value]) => setAttribute(name, value)),
  ].join(" ");
}

/**
 * Extracts the data ID and default value from the evaluated field block.
 *
 * @param block - The evaluated Autocomplete block
 * @returns The data script ID and pre-filled default value
 */
function resolveField(block: EvaluatedBlock<Autocomplete>): {
  dataId: string;
  defaultValue: unknown;
} {
  /* eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- 
  Forge resolves all block expressions before calling render, so value and
  defaultValue are present on the field block at runtime
  */
  const field = block.field.block as unknown as EvaluatedField;
  const fieldCode =
    typeof field.code === "string" ? field.code : "autocomplete-field";

  return {
    dataId: `autocomplete-data-${fieldCode}`,
    defaultValue: field.value ?? field.defaultValue,
  };
}

/**
 * Returns an HTML attribute string if value is a defined primitive, otherwise an empty string.
 *
 * @param name - The attribute name
 * @param value - The attribute value; non-primitive values are ignored
 * @returns An attribute string like `name="value"`, or an empty string
 */
function setAttribute(name: string, value: unknown): string {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return `${name}="${String(value)}"`;
  }
  return "";
}

export const autocomplete = buildNunjucksComponent<Autocomplete>(
  "autocomplete",
  (block: EvaluatedBlock<Autocomplete>): string => {
    const { dataId, defaultValue } = resolveField(block);
    const dataScript = `<script type="application/json" id="${dataId}" data-qa="${dataId}">${JSON.stringify(block.data)}</script>`;
    const wrapperAttrs = buildWrapperAttributes(block, dataId, defaultValue);
    return `${dataScript}\n<autocomplete-wrapper ${wrapperAttrs}>\n${block.field.html}\n</autocomplete-wrapper>`;
  },
);

/**
 * Creates an accessible autocomplete wrapper around a field.
 *
 * @param props - The autocomplete configuration options
 * @returns An Autocomplete block definition
 * @example
 * ```typescript
 * Autocomplete({
 *   field: GovUKTextInput({ code: 'goal', label: 'Select a goal' }),
 *   data: Data('goals'),
 * })
 * ```
 */
export function Autocomplete(props: AutocompleteProps): Autocomplete {
  return blockBuilder<Autocomplete>({
    ...props,
    variant: "autocomplete",
  });
}
