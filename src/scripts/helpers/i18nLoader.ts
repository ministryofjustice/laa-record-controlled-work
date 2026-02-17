/**
 * Simple i18next loader following official best practices
 * Provides i18next.t("common.back") syntax in TypeScript
 * and {{ t("common.back") }} syntax in Nunjucks templates
 */

import i18next from 'i18next';
import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * Type guard for locale data
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid locale data structure
 */
function isLocaleData(value: unknown): value is Record<string, Record<string, string>> {
  return typeof value === 'object' && value !== null;
}

/**
 * Initialise i18next synchronously using Node.js fs methods
 * This ensures i18next is ready before any modules that use translations are loaded
 */
export function initializeI18nextSync(): void {
  try {
    const localeFile = path.join(process.cwd(), 'locales', 'en.json');

    try {
      const localeContent = readFileSync(localeFile, 'utf8');
      const parsedData: unknown = JSON.parse(localeContent);

      // Use type guard
      const localeData = isLocaleData(parsedData) ? parsedData : {};

      // Initialise synchronously (blocks until complete)
      void i18next.init({
        lng: 'en',
        fallbackLng: 'en',
        debug: process.env.NODE_ENV === 'development',

        // Use namespaces from the JSON structure - each top-level key becomes a namespace
        ns: Object.keys(localeData),
        defaultNS: 'common',
        nsSeparator: '.', // Use dot instead of colon for namespace separation
        keySeparator: '.', // Keep dot for nested keys

        interpolation: {
          escapeValue: false, // Modern frameworks handle XSS
          prefix: '{',
          suffix: '}',
        },

        resources: {
          en: localeData
        }
      });
    } catch (fileError) {
      console.warn('Locale file not found, initializing with empty resources');
      void i18next.init({
        lng: 'en',
        fallbackLng: 'en',
        interpolation: {
          escapeValue: false,
          prefix: '{',
          suffix: '}',
        },
        resources: { en: {} }
      });
    }
  } catch (error) {
    console.error('Failed to initialise i18next synchronously:', error);
    // Initialise with empty resources as fallback
    void i18next.init({
      lng: 'en',
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
        prefix: '{',
        suffix: '}',
      },
      resources: { en: {} }
    });
  }
}

/**
 * Get the i18next instance for direct use
 */
export { i18next };

/**
 * Translation function wrapper that ensures i18next is ready
 * Usage: t("common.back") or t("pages.caseDetails.tabs.clientDetails")
 * @param {string} key - Translation key with dot notation for namespaces
 * @param {Record<string, unknown>} [options] - Optional interpolation values
 * @returns {string} The translated string
 */
export const t = (key: string, options?: Record<string, unknown>): string => {
  // Ensure i18next is initialised before calling translation
  if (!i18next.isInitialized) {
    console.warn(`i18next not initialised when translating: ${key}`);
    return key; // Return the key as fallback
  }

  return i18next.t(key, options);
};

/**
 * Express locale loader interface for backwards compatibility
 */
export interface ExpressLocaleLoader {
  t: (key: string, options?: Record<string, unknown>) => string;
}

/**
 * Nunjucks global function for templates
 * Usage in templates: {{ t("common.back") }} or {{ t("pages.caseDetails.tabs.clientDetails") }}
 * @param {string} key - Translation key
 * @param {Record<string, unknown>} [options] - Optional interpolation values
 * @returns {string} The translated string
 */
export const nunjucksT = (key: string, options?: Record<string, unknown>): string =>
  t(key, options);
