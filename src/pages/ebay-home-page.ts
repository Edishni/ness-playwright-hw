import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { LocatorDef } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';
import { CommonLocators } from '../utils/locators-loader';

export class EbayHomePage extends BasePage {
  // Centralized locators from data/locators.json
  readonly searchInput: LocatorDef[] = CommonLocators.searchInput();
  readonly searchButton: LocatorDef[] = CommonLocators.searchButton();

  // Cart link from centralized config
  readonly cartLink: LocatorDef[] = CommonLocators.cartLink();

    static searchButton: any;

  constructor(page: Page) {
    super(page);
  }

  async goto(url: string = 'https://www.ebay.com/') {
    await super.goto(url);
  }

  async search(query: string) {
    console.log(`${await currentTime()} - [search] Starting search for: "${query}"`);
    await this.type(this.searchInput, query);
    console.log(`${await currentTime()} - [search] Search query entered, clicking search button...`);
    await this.click(this.searchButton);
    console.log(`${await currentTime()} - [search] ✅ Search initiated`);
  }

  async clickCart() {
    console.log(`${await currentTime()} - [cart] Navigating to cart page...`);
    await this.click(this.cartLink);
    console.log(`${await currentTime()} - [cart] ✅ Cart link clicked`);
  }

}
