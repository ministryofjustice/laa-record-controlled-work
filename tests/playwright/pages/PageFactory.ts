import type { Page } from '@playwright/test';
import { HomePage } from './HomePage.js';

/**
 * Factory class for creating page objects
 */
export class PageFactory {
  private readonly page: Page;

  /**
   * Creates a new page factory instance
   * @param {Page} page - The Playwright page instance
   */
  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Gets an instance of the home page
   * @returns {HomePage} The home page object
   */
  get homePage(): HomePage {
    return new HomePage(this.page);
  }
}