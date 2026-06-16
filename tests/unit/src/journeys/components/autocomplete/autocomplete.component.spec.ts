import { expect } from "chai";

import type { EvaluatedBlock } from "@ministryofjustice/hmpps-forge/core/components";

import { autocomplete } from "#/journeys/components/autocomplete/autocomplete.component.js";
import type { Autocomplete as AutocompleteBlock } from "#/journeys/components/autocomplete/autocomplete.types.js";

type MockBlock = EvaluatedBlock<AutocompleteBlock>;

function makeBlock(overrides: Partial<MockBlock> = {}): MockBlock {
  return {
    type: "StructureType.Block" as MockBlock["type"],
    variant: "autocomplete",
    blockType: "BlockType.Block" as MockBlock["blockType"],
    data: ["Option A", "Option B"],
    field: {
      block: { code: "fieldCode" } as unknown as MockBlock["field"]["block"],
      html: '<input id="field-code-input" />',
    },
    ...overrides,
  } as MockBlock;
}

describe("Autocomplete component", () => {
  describe("autocomplete (registry entry)", () => {
    describe("render()", () => {
      it("includes a JSON script tag with the data", () => {
        const block = makeBlock({ data: ["Manchester", "Liverpool"] });
        const html = autocomplete.render(block);
        expect(html).to.include(
          `<script type="application/json" id="autocomplete-data-fieldCode" data-qa="autocomplete-data-fieldCode">`,
        );
        expect(html).to.include(JSON.stringify(["Manchester", "Liverpool"]));
      });




      it("falls back to 'autocomplete-field' as the field code when code is not a string", () => {
        const block = makeBlock({
          field: {
            block: { code: 42 } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
        });
        const html = autocomplete.render(block);
        expect(html).to.include("autocomplete-data-autocomplete-field");
      });

      it("sets data-autocomplete-default-value from field.value", () => {
        const block = makeBlock({
          field: {
            block: {
              code: "goal",
              value: "pre-filled-value",
            } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
        });
        const html = autocomplete.render(block);
        expect(html).to.include(
          'data-autocomplete-default-value="pre-filled-value"',
        );
      });

      it("falls back to field.defaultValue when field.value is undefined", () => {
        const block = makeBlock({
          field: {
            block: {
              code: "goal",
              defaultValue: "default-option",
            } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
        });
        const html = autocomplete.render(block);
        expect(html).to.include(
          'data-autocomplete-default-value="default-option"',
        );
      });

      it("omits data-autocomplete-default-value when both value and defaultValue are undefined", () => {
        const block = makeBlock({
          field: {
            block: { code: "goal" } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
        });
        const html = autocomplete.render(block);
        expect(html).not.to.include("data-autocomplete-default-value");
      });

      it("renders optional attributes when provided", () => {
        const block = makeBlock({
          dataKeyFrom: "#area-of-need",
          minLength: 3,
          autoselect: true,
          confirmOnBlur: false,
          displayMenu: "overlay",
          showAllValues: true,
          showNoOptionsFound: true,
          menuClasses: "my-menu",
          inputClasses: "my-input",
          hintClasses: "my-hint",
        });
        const html = autocomplete.render(block);
        expect(html).to.include(
          'data-autocomplete-source-key-from="#area-of-need"',
        );
        expect(html).to.include('data-autocomplete-min-length="3"');
        expect(html).to.include('data-autocomplete-autoselect="true"');
        expect(html).to.include('data-autocomplete-confirm-on-blur="false"');
        expect(html).to.include('data-autocomplete-display-menu="overlay"');
        expect(html).to.include('data-autocomplete-show-all-values="true"');
        expect(html).to.include('data-autocomplete-show-no-options="true"');
        expect(html).to.include('data-autocomplete-menu-classes="my-menu"');
        expect(html).to.include('data-autocomplete-input-classes="my-input"');
        expect(html).to.include('data-autocomplete-hint-classes="my-hint"');
      });

      it("omits optional attributes when not provided", () => {
        const block = makeBlock();
        const html = autocomplete.render(block);
        expect(html).not.to.include("data-autocomplete-source-key-from");
        expect(html).not.to.include("data-autocomplete-min-length");
        expect(html).not.to.include("data-autocomplete-autoselect");
        expect(html).not.to.include("data-autocomplete-menu-classes");
        expect(html).not.to.include("data-autocomplete-menu-attributes");
      });

      it("serialises menuAttributes as JSON", () => {
        const block = makeBlock({
          menuAttributes: { "aria-labelledby": "my-label" },
        });
        const html = autocomplete.render(block);
        expect(html).to.include(
          `data-autocomplete-menu-attributes='{"aria-labelledby":"my-label"}'`,
        );
      });


      it("wraps output in autocomplete-with-clear div and renders a clear button when clearLinkText is set", () => {
        const block = makeBlock({
          field: {
            block: { code: "fieldCode" } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
          clearLinkText: "Clear",
        });
        const html = autocomplete.render(block);
        expect(html).to.include('<div class="autocomplete-with-clear">');
        expect(html).to.include('id="fieldCode-clear"');
        expect(html).to.include("Clear");
      });

      it("does not render the clear button when clearLinkText is an empty string", () => {
        const block = makeBlock({ clearLinkText: "" });
        const html = autocomplete.render(block);
        expect(html).not.to.include('-clear"');
      });
    });
  });
});
