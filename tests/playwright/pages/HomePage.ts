import type { Page, Locator } from '@playwright/test';
import { TEST_CONFIG } from '../playwright.config.js';

/**
 * Page object for the home page
 */
export class HomePage {
  private readonly page: Page;
  private readonly url: string;

  /**
   * Creates a new home page object
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
    this.url = TEST_CONFIG.BASE_URL + '/';
  }

  /**
   * Gets the main heading element
   * @returns {Locator} The main heading locator
   */
  get heading(): Locator {
    return this.page.locator('h1.govuk-heading-xl');
  }

  /**
   * Gets the mountains table element
   * @returns {Locator} The mountains table locator
   */
  get mountainsTable(): Locator {
    return this.page.locator('table');
  }

  /**
   * Gets the mountains table caption
   * @returns {Locator} The table caption locator
   */
  get tableCaption(): Locator {
    return this.page.locator('caption');
  }

  /**
   * Gets a specific mountain row by name
   * @param {string} mountainName - The name of the mountain to find
   * @returns {Locator} The table row locator for the specified mountain
   */
  getMountainRow(mountainName: string): Locator {
    return this.page.locator(`tr:has-text("${mountainName}")`);
  }

  /**
   * Navigates to the home page
   */
  async navigate(): Promise<void> {
    await this.page.goto(this.url);
  }

  /**
   * Waits for the page to fully load
   */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Gets the service name from the heading
   * @returns {Promise<string>} The service name text
   */
  async getServiceName(): Promise<string> {
    return await this.heading.textContent() || '';
  }

  /**
   * Gets all mountain names from the table
   * @returns {Promise<string[]>} Array of mountain names
   */
  async getMountainNames(): Promise<string[]> {
    const rows = this.page.locator('tbody tr');
    const count = await rows.count();
    const names: string[] = [];
    
    for (let i = 0; i < count; i++) {
      const firstCell = rows.nth(i).locator('td').first();
      const name = await firstCell.textContent();
      if (name) {
        names.push(name.trim());
      }
    }
    
    return names;
  }
}