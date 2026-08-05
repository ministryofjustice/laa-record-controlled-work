/**
 * @description Test for i18nLoader functions
 */

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect } from "chai";
import sinon from "sinon";

import {
  i18next,
  initializeI18nextSync,
  nunjucksT,
  t,
} from "#/lib/i18n.js";

describe("i18nLoader", () => {
  const tempDirs: string[] = [];

  function resetI18next(): void {
    Object.defineProperty(i18next, "isInitialized", {
      configurable: true,
      value: false,
      writable: true,
    });

    const resourceStore = (i18next as any).services?.resourceStore;
    if (resourceStore !== undefined) {
      resourceStore.data = {};
    }
  }

  function createTempCwdWithLocale(content?: string): string {
    const tempDir = mkdtempSync(path.join(tmpdir(), "i18n-loader-"));
    tempDirs.push(tempDir);

    if (content !== undefined) {
      const localesDir = path.join(tempDir, "locales");
      mkdirSync(localesDir, { recursive: true });
      writeFileSync(path.join(localesDir, "en.json"), content, "utf8");
    }

    return tempDir;
  }

  async function initTranslationResources(): Promise<void> {
    resetI18next();
    await i18next.init({
      defaultNS: "common",
      fallbackLng: "en",
      interpolation: {
        escapeValue: false,
        prefix: "{",
        suffix: "}",
      },
      keySeparator: ".",
      lng: "en",
      ns: ["common"],
      nsSeparator: ".",
      resources: {
        en: {
          common: {
            greeting: "Hello {name}",
            saveAndReturn: "Save and return later",
          },
        },
      },
    });
  }

  afterEach(() => {
    sinon.restore();

    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      if (dir !== undefined) {
        rmSync(dir, { force: true, recursive: true });
      }
    }
  });

  describe("initializeI18nextSync", () => {
    it("should initialize i18next with locale data when file exists", () => {
      resetI18next();
      const tempCwd = createTempCwdWithLocale(
        JSON.stringify({ common: { continue: "Continue" } }),
      );
      sinon.stub(process, "cwd").returns(tempCwd);

      initializeI18nextSync();

      expect(i18next.isInitialized).to.be.true;
      expect(t("common.continue")).to.equal("Continue");
    });

    it("should initialize with empty resources when locale file not found", () => {
      resetI18next();
      const tempCwd = createTempCwdWithLocale();
      sinon.stub(process, "cwd").returns(tempCwd);

      initializeI18nextSync();

      expect(i18next.isInitialized).to.be.true;
      expect(t("common.continue")).to.equal("continue");
    });

    it("should handle JSON parse errors gracefully", () => {
      resetI18next();
      const tempCwd = createTempCwdWithLocale("invalid json");
      sinon.stub(process, "cwd").returns(tempCwd);

      initializeI18nextSync();

      expect(i18next.isInitialized).to.be.true;
      expect(t("common.continue")).to.equal("continue");
    });

    it("should handle general initialization errors", () => {
      resetI18next();
      sinon.stub(path, "join").throws(new Error("Path error"));

      initializeI18nextSync();

      expect(i18next.isInitialized).to.be.true;
      expect(t("common.continue")).to.equal("continue");
    });
  });

  describe("translation functions", () => {
    describe("t", () => {
      it("should return translated text for valid keys", async () => {
        await initTranslationResources();

        expect(t("saveAndReturn")).to.equal("Save and return later");
      });

      it("should handle interpolation", async () => {
        await initTranslationResources();

        expect(t("greeting", { name: "John" })).to.equal("Hello John");
      });

      it("should return key when translation not found", async () => {
        await initTranslationResources();

        expect(t("nonexistent.key")).to.equal("nonexistent.key");
      });

      it("should return key when i18next not initialized", () => {
        Object.defineProperty(i18next, "isInitialized", {
          configurable: true,
          value: false,
          writable: true,
        });

        expect(t("saveAndReturn")).to.equal("saveAndReturn");
      });
    });

    describe("nunjucksT", () => {
      it("should return same result as t function", async () => {
        await initTranslationResources();

        expect(nunjucksT("saveAndReturn")).to.equal(t("saveAndReturn"));
      });
    });
  });
});
