import { Page, Locator } from '@playwright/test';
import { getElement, LocatorDef } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';

export abstract class BasePage {
  protected page: Page;
  protected defaultTimeout = 15000;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    console.log(`${await currentTime()} - [BasePage] navigate -> ${url}`);
    await this.page.goto(url, { timeout: this.defaultTimeout });
  }

  protected async click(locators: LocatorDef | LocatorDef[]) {
    const el = await getElement(this.page, Array.isArray(locators) ? locators : [locators], { timeout: this.defaultTimeout });
    console.log(`${await currentTime()} - [BasePage] click`);
    await el.click({ timeout: this.defaultTimeout });
  }

  protected async type(locators: LocatorDef | LocatorDef[], value: string) {
    const el = await getElement(this.page, Array.isArray(locators) ? locators : [locators], { timeout: this.defaultTimeout });
    console.log(`${await currentTime()} - [BasePage] type: ${value}`);
    await el.fill(value, { timeout: this.defaultTimeout });
  }

  protected async waitFor(locators: LocatorDef | LocatorDef[]) {
    await getElement(this.page, Array.isArray(locators) ? locators : [locators], { timeout: this.defaultTimeout });
  }
}
