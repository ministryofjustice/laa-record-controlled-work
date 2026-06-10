import accessibleAutocomplete from "accessible-autocomplete";

class AccessibleAutocomplete extends HTMLElement {
  constructor() {
    super();
    if (this.dataset.initialized) {
      return;
    }

    this.dataset.initialized = "true";

    const input = this.querySelector("input");

    if (!input) {
      console.warn("accessible-autocomplete: no input found", this);
      return;
    }

    const source = this.getSource();
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

    accessibleAutocomplete({
      autoselect: this.dataset.autocompleteAutoselect === "true",
      confirmOnBlur: this.dataset.autocompleteConfirmOnBlur !== "false",
      defaultValue,
      displayMenu: this.dataset.autocompleteDisplayMenu ?? "inline",
      element: this,
      hintClasses: this.dataset.autocompleteHintClasses ?? null,
      id: `${inputId}`,
      inputClasses: this.dataset.autocompleteInputClasses ?? null,
      menuAttributes: this.dataset.autocompleteMenuAttributes
        ? JSON.parse(this.dataset.autocompleteMenuAttributes)
        : {},
      menuClasses: this.dataset.autocompleteMenuClasses ?? null,
      minLength: parseInt(this.dataset.autocompleteMinLength ?? "2", 10),
      name: inputName,
      showAllValues: this.dataset.autocompleteShowAllValues === "true",
      showNoOptionsFound: this.dataset.autocompleteShowNoOptions === "true",
      source,
    });
    this.preserveDescribedBy(originalDescribedByErrorIds);
  }

  getData(sourceId) {
    const el = document.getElementById(sourceId);

    if (!el) {
      console.warn(
        `accessible-autocomplete: data element #${sourceId} not found`,
      );
      return {};
    }

    try {
      return JSON.parse(el.textContent || "{}");
    } catch (e) {
      console.error(
        `accessible-autocomplete: failed to parse JSON from #${sourceId}`,
        e,
      );
      return {};
    }
  }

  getSource() {
    const sourceId = this.dataset.autocompleteSource;

    if (!sourceId) {
      return [];
    }

    const data = this.getData(sourceId);
    const keyFromSelector = this.dataset.autocompleteSourceKeyFrom;

    if (keyFromSelector && typeof data === "object" && !Array.isArray(data)) {
      const keyElement = document.querySelector(keyFromSelector);
      const key = keyElement?.value ?? "";

      return data[key] ?? [];
    }

    return Array.isArray(data) ? data : [];
  }

  preserveDescribedBy(originalIds) {
    if (originalIds.length === 0) {
      return;
    }

    const input = this.querySelector("input");

    if (!input) {
      return;
    }

    const merge = () => {
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

customElements.define(
  "accessible-autocomplete-wrapper",
  AccessibleAutocomplete,
);
