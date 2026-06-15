import autocomplete, {
  type AutocompleteOptions,
} from "accessible-autocomplete";

/**
 * Custom element that progressively enhances a wrapped input into an
 * accessible autocomplete widget using the alphagov accessible-autocomplete library.
 *
 * Configuration is read from `data-autocomplete-*` attributes set by the
 * server-rendered component. Options data is loaded from a sibling
 * `<script type="application/json">` element identified by `data-autocomplete-source`.
 */
class Autocomplete extends HTMLElement {
  /**
   * Initialises the autocomplete when the element is connected; guards
   * against double-initialisation via the `initialized` dataset flag.
   */
  constructor() {
    super();
    if (!this.dataset.initialized) {
      this.initialize();
    }
  }

  /**
   * Reads and parses the JSON data from the element identified by `sourceId`.
   *
   * @param sourceId - The id of the script element containing the JSON data
   * @returns The parsed data, or an empty object if not found or invalid
   */
  private static getData(
    sourceId: string,
  ): Record<string, unknown> | unknown[] {
    const el = document.getElementById(sourceId);

    if (!el) {
      // eslint-disable-next-line no-console -- no server logger available in browser context
      console.warn(
        `accessible-autocomplete: data element #${sourceId} not found`,
      );
      return {};
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- runtime JSON; shape validated by server-side component
      return JSON.parse(el.textContent || "{}") as
        | Record<string, unknown>
        | unknown[];
    } catch (e) {
      // eslint-disable-next-line no-console -- no server logger available in browser context
      console.error(
        `accessible-autocomplete: failed to parse JSON from #${sourceId}`,
        e,
      );
      return {};
    }
  }

  /**
   * Builds the options object for the accessible-autocomplete library.
   *
   * @param inputId - The id of the original input element
   * @param inputName - The name attribute of the original input element
   * @param defaultValue - The pre-filled value to show in the autocomplete input
   * @returns The options object to pass to accessible-autocomplete
   */
  private buildOptions(
    inputId: string,
    inputName: string,
    defaultValue: string,
  ): AutocompleteOptions {
    return {
      autoselect: this.dataset.autocompleteAutoselect === "true",
      confirmOnBlur: this.dataset.autocompleteConfirmOnBlur !== "false",
      defaultValue,
      displayMenu:
        this.dataset.autocompleteDisplayMenu === "overlay"
          ? "overlay"
          : "inline",
      element: this,
      hintClasses: this.dataset.autocompleteHintClasses ?? null,
      id: inputId,
      inputClasses: this.dataset.autocompleteInputClasses ?? null,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- JSON.parse returns any; shape is set by the server component
      menuAttributes: this.dataset.autocompleteMenuAttributes
        ? JSON.parse(this.dataset.autocompleteMenuAttributes)
        : {},
      menuClasses: this.dataset.autocompleteMenuClasses ?? null,
      minLength: parseInt(this.dataset.autocompleteMinLength ?? "2", 10),
      name: inputName,
      showAllValues: this.dataset.autocompleteShowAllValues === "true",
      showNoOptionsFound: this.dataset.autocompleteShowNoOptions === "true",
      source: this.getSource(),
    };
  }

  /**
   * Resolves the autocomplete source array from the JSON data element,
   * optionally filtering by a key derived from another element's value.
   *
   * @returns An array of autocomplete option strings
   */
  private getSource(): string[] {
    const sourceId = this.dataset.autocompleteSource;

    if (!sourceId) {
      return [];
    }

    const data = Autocomplete.getData(sourceId);
    const keyFromSelector = this.dataset.autocompleteSourceKeyFrom;

    if (keyFromSelector && !Array.isArray(data) && typeof data === "object") {
      const keyElement =
        document.querySelector<HTMLInputElement>(keyFromSelector);
      const key = keyElement?.value ?? "";
      const values = data[key];

      return Array.isArray(values)
        ? values.filter((v): v is string => typeof v === "string")
        : [];
    }

    return Array.isArray(data)
      ? data.filter((v): v is string => typeof v === "string")
      : [];
  }

  /**
   * Replaces the raw input with the accessible-autocomplete widget.
   */
  private initialize(): void {
    this.dataset.initialized = "true";

    const input = this.querySelector("input");

    if (!input) {
      console.warn("accessible-autocomplete: no input found", this);
      return;
    }

    const defaultValue = this.dataset.autocompleteDefaultValue ?? input.value;
    const inputId = input.id;
    const inputName = input.name;
    const errorId = `${inputId}-error`;
    const originalDescribedByErrorIds = (
      input.getAttribute("aria-describedby") ?? ""
    )
      .split(" ")
      .filter((id) => id === errorId);

    input.remove();

    autocomplete(this.buildOptions(inputId, inputName, defaultValue));
    this.preserveDescribedBy(originalDescribedByErrorIds);
  }

  /**
   * Merges the original `aria-describedby` error IDs back onto the
   * accessible-autocomplete input after it replaces the original input,
   * keeping a MutationObserver to re-apply them if the library overwrites them.
   *
   * @param originalIds - The error-related IDs to preserve
   */
  private preserveDescribedBy(originalIds: string[]): void {
    if (!originalIds.length) {
      return;
    }

    const input = this.querySelector("input");

    if (!input) {
      return;
    }

    const merge = (): void => {
      const current = (input.getAttribute("aria-describedby") ?? "")
        .split(" ")
        .filter(Boolean);
      const merged = [...new Set([...current, ...originalIds])].join(" ");

      if (merged !== input.getAttribute("aria-describedby")) {
        observer.disconnect();
        input.setAttribute("aria-describedby", merged);
        observer.observe(input, {
          attributeFilter: ["aria-describedby"],
          attributes: true,
        });
      }
    };

    const observer = new MutationObserver(merge);
    observer.observe(input, {
      attributeFilter: ["aria-describedby"],
      attributes: true,
    });
    merge();
  }
}

customElements.define("autocomplete-wrapper", Autocomplete);
