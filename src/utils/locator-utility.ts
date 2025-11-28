import { Page, Locator, TestInfo } from '@playwright/test';
import { currentTime } from './time-utility';

export type LocatorDef = { type: 'css' | 'xpath' | 'text'; value: string };

export async function getElement(page: Page, locators: LocatorDef[], options?: { timeout?: number; testInfo?: TestInfo }): Promise<Locator> {
  const timeout = options?.timeout ?? 8000;
  const start = Date.now();
  const backoffBase = 300;

  for (const loc of locators) {
    const selector = loc.type === 'css' ? loc.value : loc.type === 'xpath' ? `xpath=${loc.value}` : `text=${loc.value}`;
    let attempt = 0;
    console.log(`${await currentTime()} - [locator] trying ${loc.type}=${loc.value}`);
    while (Date.now() - start < timeout) {
      attempt++;
      try {
        const locator = page.locator(selector);
        const count = await locator.count();
        if (count > 0) {
          console.log(`${await currentTime()} - [locator] success: ${loc.type}=${loc.value} (attempt ${attempt})`);
          return locator.first();
        }
      } catch (e) {
        // swallow and retry
      }
      await page.waitForTimeout(backoffBase * attempt);
    }
    console.warn(`${await currentTime()} - [locator] failed for ${loc.type}=${loc.value}, trying next`);
  }
  
  // Generate meaningful screenshot name with test info
  let testName = 'unknown-test';
  if (options?.testInfo) {
    const titleSlug = options.testInfo.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    testName = `${options.testInfo.project.name}-${titleSlug}`;
  }
  
  const failurePath = `test-results/locator-failure-${testName}-${Date.now()}.png`;
  try { await page.screenshot({ path: failurePath }); } catch (e) {}
  throw new Error(`All locators failed: ${locators.map(l=>l.value).join(', ')}; screenshot: ${failurePath}`);
}
