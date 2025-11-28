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

  async goto() {
    await super.goto('https://www.ebay.com/');
  }

  async searchForItem(query: string) {
    console.log(`${await currentTime()} - [EbayHomePage] Search for: ${query}`);
    await this.type(this.searchInput, query);
    await this.click(this.searchButton);
  }

  async clickCart() {
    console.log(`${await currentTime()} - [EbayHomePage] Click Cart`);
    await this.click(this.cartLink);
  }

}
