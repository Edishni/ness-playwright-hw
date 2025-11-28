import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { currentTime } from '../utils/time-utility';

test.describe('CI Optimized Tests', () => {
    
    test('CI.1: Basic eBay homepage load', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CI.1] Browser: ${browserName.toUpperCase()} - Basic homepage test`);

        // Basic navigation test with longer timeout
        await page.goto('https://www.ebay.com/', { 
            waitUntil: 'domcontentloaded', 
            timeout: 45000 
        });
        
        await expect(page).toHaveTitle(/eBay/, { timeout: 10000 });
        console.log(`${await currentTime()} - [CI.1] eBay homepage loaded successfully`);
        
        // Basic search input test
        await page.locator('input#gh-ac').waitFor({ state: 'visible', timeout: 15000 });
        await page.locator('input#gh-ac').fill('test');
        console.log(`${await currentTime()} - [CI.1] Search input working`);
        
        // Screenshot for verification
        if (testInfo) {
            const screenshot = await page.screenshot();
            testInfo.attach('ci-homepage-test', {
                body: screenshot,
                contentType: 'image/png'
            });
        }
        
        console.log(`${await currentTime()} - [CI.1] Homepage test completed successfully`);
    });

    test('CI.2: Search functionality test (CR1.1 Simplified)', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CI.2] Browser: ${browserName.toUpperCase()} - Search test`);

        try {
            // Navigate with extended timeout
            console.log(`${await currentTime()} - [CI.2] Navigating to eBay`);
            await page.goto('https://www.ebay.com/', { 
                waitUntil: 'networkidle', 
                timeout: 60000 
            });
            
            // Search for shoes
            console.log(`${await currentTime()} - [CI.2] Performing search`);
            await page.locator('input#gh-ac').waitFor({ state: 'visible', timeout: 20000 });
            await page.locator('input#gh-ac').fill('shoes');
            
            await page.locator('button#gh-search-btn').waitFor({ state: 'visible', timeout: 20000 });
            await page.locator('button#gh-search-btn').click();
            
            // Wait for results with very long timeout
            console.log(`${await currentTime()} - [CI.2] Waiting for search results`);
            await page.waitForLoadState('networkidle', { timeout: 90000 });
            
            // Verify results appear
            await expect(page.locator('.srp-results, .s-result-list')).toBeVisible({ timeout: 30000 });
            console.log(`${await currentTime()} - [CI.2] ✅ Search results loaded successfully`);
            
            // Screenshot for verification
            if (testInfo) {
                const screenshot = await page.screenshot();
                testInfo.attach('ci-search-results', {
                    body: screenshot,
                    contentType: 'image/png'
                });
            }
            
        } catch (error) {
            console.error(`${await currentTime()} - [CI.2] ❌ Search test failed: ${error}`);
            
            // Screenshot on failure
            try {
                const screenshot = await page.screenshot();
                testInfo.attach('ci-search-failure', {
                    body: screenshot,
                    contentType: 'image/png'
                });
            } catch (screenshotError) {
                console.error(`Failed to take failure screenshot: ${screenshotError}`);
            }
            
            throw error;
        }
    });
});