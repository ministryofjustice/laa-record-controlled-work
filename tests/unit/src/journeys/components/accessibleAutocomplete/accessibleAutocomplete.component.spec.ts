import { expect } from "chai";

import type { EvaluatedBlock } from "@ministryofjustice/hmpps-forge/core/components";

import {
  AccessibleAutocomplete,
  accessibleAutocomplete,
} from "#/journeys/components/accessibleAutocomplete/accessibleAutocomplete.component.js";
import type { AccessibleAutocomplete as AccessibleAutocompleteBlock } from "#/journeys/components/accessibleAutocomplete/accessibleAutocomplete.types.js";

type MockBlock = EvaluatedBlock<AccessibleAutocompleteBlock>;

function makeBlock(overrides: Partial<MockBlock> = {}): MockBlock {
  return {
    type: "StructureType.Block" as MockBlock["type"],
    variant: "accessibleAutocomplete",
    blockType: "BlockType.Block" as MockBlock["blockType"],
    data: ["Option A", "Option B"],
    field: {
      block: { code: "fieldCode" } as unknown as MockBlock["field"]["block"],
      html: '<input id="field-code-input" />',
    },
    ...overrides,
  } as MockBlock;
}

describe("AccessibleAutocomplete component", () => {
  describe("accessibleAutocomplete (registry entry)", () => {
    it("has variant 'accessibleAutocomplete'", () => {
      expect(accessibleAutocomplete.variant).to.equal("accessibleAutocomplete");
    });

    describe("render()", () => {
      it("includes a JSON script tag with the data", () => {
        const block = makeBlock({ data: ["Manchester", "Liverpool"] });
        const html = accessibleAutocomplete.render(block);
        expect(html).to.include(
          `<script type="application/json" id="autocomplete-data-fieldCode" data-qa="autocomplete-data-fieldCode">`,
        );
        expect(html).to.include(JSON.stringify(["Manchester", "Liverpool"]));
      });

      it("wraps the field HTML in an accessible-autocomplete-wrapper element", () => {
        const block = makeBlock();
        const html = accessibleAutocomplete.render(block);
        expect(html).to.include("<accessible-autocomplete-wrapper ");
        expect(html).to.include("</accessible-autocomplete-wrapper>");
        expect(html).to.include('<input id="field-code-input" />');
      });

      it("sets data-autocomplete-source to the script tag ID derived from field code", () => {
        const block = makeBlock();
        const html = accessibleAutocomplete.render(block);
        expect(html).to.include(
          'data-autocomplete-source="autocomplete-data-fieldCode"',
        );
      });

      it("falls back to 'autocomplete-field' as the field code when code is not a string", () => {
        const block = makeBlock({
          field: {
            block: { code: 42 } as unknown as MockBlock["field"]["block"],
            html: "<input />",
          },
        });
        const html = accessibleAutocomplete.render(block);
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
        const html = accessibleAutocomplete.render(block);
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
        const html = accessibleAutocomplete.render(block);
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
        const html = accessibleAutocomplete.render(block);
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
        const html = accessibleAutocomplete.render(block);
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
        const html = accessibleAutocomplete.render(block);
        expect(html).not.to.include("data-autocomplete-source-key-from");
        expect(html).not.to.include("data-autocomplete-min-length");
        expect(html).not.to.include("data-autocomplete-autoselect");
        expect(html).not.to.include("data-autocomplete-menu-classes");
      });

      it("serialises menuAttributes as JSON", () => {
        const block = makeBlock({
          menuAttributes: { "aria-labelledby": "my-label" },
        });
        const html = accessibleAutocomplete.render(block);
        expect(html).to.include(
          `data-autocomplete-menu-attributes='{"aria-labelledby":"my-label"}'`,
        );
      });

      it("omits data-autocomplete-menu-attributes when menuAttributes is not provided", () => {
        const block = makeBlock();
        const html = accessibleAutocomplete.render(block);
        expect(html).not.to.include("data-autocomplete-menu-attributes");
      });

      it("encodes a keyed data object as JSON", () => {
        const data = { countries: ["Ireland", "Goal B"], risks: ["Risk X"] };
        const block = makeBlock({ data });
        const html = accessibleAutocomplete.render(block);
        expect(html).to.include(JSON.stringify(data));
      });
    });
  });

  describe("AccessibleAutocomplete() builder", () => {
    it("returns a block with variant 'accessibleAutocomplete'", () => {
      const result = AccessibleAutocomplete({
        data: ["Option 1"],
        field: {} as AccessibleAutocompleteBlock["field"],
      });
      expect(result.variant).to.equal("accessibleAutocomplete");
    });

    it("includes the provided props in the returned block", () => {
      const data = ["Alpha", "Beta"];
      const result = AccessibleAutocomplete({
        data,
        field: {} as AccessibleAutocompleteBlock["field"],
        minLength: 2,
        autoselect: true,
      });
      expect(result.data).to.deep.equal(data);
      expect(result.minLength).to.equal(2);
      expect(result.autoselect).to.equal(true);
    });
  });
});
