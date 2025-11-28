import { test, expect } from '@playwright/test';
import { currentTime } from '../utils/time-utility';

test.describe('Single CI Test', () => {
    
    test('CI-Single: Just verify eBay homepage loads', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CI-Single] Browser: ${browserName.toUpperCase()} - Single test`);

        try {
            // Simple homepage load test only
            console.log(`${await currentTime()} - [CI-Single] Loading eBay homepage...`);
            
            await page.goto('https://www.ebay.com/', { 
                waitUntil: 'domcontentloaded', 
                timeout: 45000 
            });
            
            // Just verify title
            await expect(page).toHaveTitle(/eBay/, { timeout: 10000 });
            console.log(`${await currentTime()} - [CI-Single] ✅ eBay homepage loaded successfully!`);
            
            // Verify search input exists (no interaction)
            await expect(page.locator('input#gh-ac')).toBeVisible({ timeout: 10000 });
            console.log(`${await currentTime()} - [CI-Single] ✅ Search input is visible!`);
            
            // Screenshot for verification
            if (testInfo) {
                const screenshot = await page.screenshot();
                testInfo.attach('ci-single-success', {
                    body: screenshot,
                    contentType: 'image/png'
                });
            }
            
            console.log(`${await currentTime()} - [CI-Single] ✅ Test completed successfully!`);
            
        } catch (error) {
            console.error(`${await currentTime()} - [CI-Single] ❌ Test failed: ${error}`);
            
            // Screenshot on failure
            try {
                const screenshot = await page.screenshot();
                if (testInfo) {
                    testInfo.attach('ci-single-failure', {
                        body: screenshot,
                        contentType: 'image/png'
                    });
                }
            } catch (screenshotError) {
                console.error(`Failed to take failure screenshot: ${screenshotError}`);
            }
            
            throw error;
        }
    });
});