/**
 * E2E Test i18n Helper
 * 
 * Provides i18next initialization for E2E tests to ensure consistency
 * with the actual application translations.
 */

import i18next from 'i18next';
import path from 'node:path';
import { readFileSync } from 'node:fs';

/**
 * Type guard for locale data
 * @param {unknown} value - The value to check
 * @returns {boolean} True if the value is a valid locale data structure
 */
function isLocaleData(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Initialize i18next synchronously for E2E tests
 * @returns {typeof i18next} The initialized i18next instance
 */
export function initI18nSync(): typeof i18next {
  try {
    const localeFile = path.join(process.cwd(), 'locales', 'en.json');

    try {
      const localeContent = readFileSync(localeFile, 'utf8');
      const parsedData: unknown = JSON.parse(localeContent);

      // Use type guard
      const localeData = isLocaleData(parsedData) ? parsedData : {};

      // Initialize synchronously
      void i18next.init({
        lng: 'en',
        fallbackLng: 'en',
        debug: false, // Disable debug for E2E tests
        resources: {
          en: {
            translation: localeData,
          },
        },
      });

      return i18next;
    } catch (fileError) {
      console.error('Failed to read or parse locale file:', fileError);
      throw new Error('Locale file could not be loaded');
    }
  } catch (initError) {
    console.error('Failed to initialize i18next:', initError);
    throw new Error('i18next initialization failed');
  }
}

/**
 * Get translated text for E2E test assertions
 * @param {string} key - The translation key
 * @returns {string} The translated string
 */
export const t = (key: string): string => i18next.t(key);