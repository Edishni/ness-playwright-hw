import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { currentTime } from '../utils/time-utility';

test.describe('CI Smoke Tests', () => {
    
    test('CI.1: Basic eBay homepage load and search', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CI.1] Browser: ${browserName.toUpperCase()} - Basic homepage test`);

        const homePage = new EbayHomePage(page);
        
        // Basic navigation test
        await homePage.goto();
        await expect(page).toHaveTitle(/eBay/);
        
        console.log(`${await currentTime()} - [CI.1] eBay homepage loaded successfully`);
        
        // Basic search input test
        await page.locator('input#gh-ac').waitFor({ state: 'visible', timeout: 10000 });
        await page.locator('input#gh-ac').fill('test');
        
        console.log(`${await currentTime()} - [CI.1] Search input working`);
        
        // Screenshot for verification
        if (testInfo) {
            const screenshot = await page.screenshot();
            testInfo.attach('ci-smoke-test', {
                body: screenshot,
                contentType: 'image/png'
            });
        }
        
        console.log(`${await currentTime()} - [CI.1] Smoke test completed successfully`);
    });
});