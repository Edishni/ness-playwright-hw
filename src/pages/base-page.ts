import { Page, Locator } from '@playwright/test';
import { getElement, LocatorDef } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';
import { allure } from 'allure-playwright';

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

  /**
   * Take a screenshot with proper naming convention
   */
  protected async takeScreenshot(name: string, attachToAllure: boolean = false): Promise<void> {
    try {
      const timestamp = await currentTime();
      const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '-');
      const filename = `${sanitizedName}-${timestamp.replace(/[:.\s]/g, '-')}.png`;
      
      const screenshotBuffer = await this.page.screenshot({
        fullPage: true,
        path: `test-results/${filename}`
      });
      
      if (attachToAllure && typeof allure !== 'undefined') {
        await allure.attachment(name, screenshotBuffer, 'image/png');
      }
      
      console.log(`${timestamp} - [screenshot] 📸 Saved: ${filename}`);
    } catch (error) {
      console.log(`${await currentTime()} - [screenshot] ⚠️ Failed: ${error}`);
    }
  }

  /**
   * Take screenshot on element interaction failure
   */
  protected async takeFailureScreenshot(action: string, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message.slice(0, 30) : 'unknown-error';
    await this.takeScreenshot(`failure-${action}-${errorMessage}`, true);
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
