import { Page } from '@playwright/test';
import { getElement, LocatorDef } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';


export abstract class BasePage {
  protected page: Page;
  protected defaultTimeout = 15000;

  constructor(page: Page) {
    this.page = page;
  }

  async goto(url: string) {
    console.log(`${await currentTime()} - [nav] Navigating to: ${url}`);
    
    // Use waitUntil: 'domcontentloaded' for better reliability (Playwright best practice)
    await this.page.goto(url, { 
      timeout: this.defaultTimeout,
      waitUntil: 'domcontentloaded'
    });
    
    console.log(`${await currentTime()} - [nav] ✅ Navigation completed`);
  }

  protected async click(locators: LocatorDef | LocatorDef[]) {
    const locatorArray = Array.isArray(locators) ? locators : [locators];
    console.log(`${await currentTime()} - [action] Clicking element: ${locatorArray[0].type}=${locatorArray[0].value.slice(0, 30)}...`);
    const el = await getElement(this.page, locatorArray, { timeout: this.defaultTimeout });
    await el.click({ timeout: this.defaultTimeout });
    console.log(`${await currentTime()} - [action] ✅ Click completed`);
  }

  protected async type(locators: LocatorDef | LocatorDef[], value: string) {
    const locatorArray = Array.isArray(locators) ? locators : [locators];
    console.log(`${await currentTime()} - [input] Typing into element: ${locatorArray[0].type}=${locatorArray[0].value.slice(0, 30)}...`);
    console.log(`${await currentTime()} - [input] Text to type: "${value}"`);
    const el = await getElement(this.page, locatorArray, { timeout: this.defaultTimeout });
    await el.fill(value, { timeout: this.defaultTimeout });
    console.log(`${await currentTime()} - [input] ✅ Text entry completed`);
  }

  protected async waitFor(locators: LocatorDef | LocatorDef[]) {
    const locatorArray = Array.isArray(locators) ? locators : [locators];
    console.log(`${await currentTime()} - [wait] Waiting for element: ${locatorArray[0].type}=${locatorArray[0].value.slice(0, 30)}...`);
    await getElement(this.page, locatorArray, { timeout: this.defaultTimeout });
    console.log(`${await currentTime()} - [wait] ✅ Element found and ready`);
  }
}
