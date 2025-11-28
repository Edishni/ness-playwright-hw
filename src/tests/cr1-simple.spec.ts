import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { currentTime } from '../utils/time-utility';

test.describe('Simplified CR1 Tests', () => {
    
    test('CR1.1-Simple: Basic search functionality test', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CR1.1-Simple] Browser: ${browserName.toUpperCase()} - Basic search test`);

        try {
            // Step 1: Navigate to eBay
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 1: Navigate to eBay`);
            await page.goto('https://www.ebay.com/', { 
                waitUntil: 'domcontentloaded', 
                timeout: 30000 
            });
            
            // Step 2: Find search input
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 2: Find search input`);
            const searchInput = page.locator('input#gh-ac');
            await searchInput.waitFor({ state: 'visible', timeout: 15000 });
            
            // Step 3: Enter search term
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 3: Enter search term`);
            await searchInput.fill('shoes');
            
            // Step 4: Find and click search button  
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 4: Click search button`);
            const searchButton = page.locator('button#gh-search-btn');
            await searchButton.waitFor({ state: 'visible', timeout: 15000 });
            await searchButton.click();
            
            // Step 5: Wait for results page to load
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 5: Wait for results`);
            await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
            
            // Step 6: Verify we're on results page
            console.log(`${await currentTime()} - [CR1.1-Simple] Step 6: Verify results page`);
            await expect(page.locator('.srp-results')).toBeVisible({ timeout: 15000 });
            
            console.log(`${await currentTime()} - [CR1.1-Simple] ✅ Test completed successfully`);
            
            // Screenshot for verification
            if (testInfo) {
                const screenshot = await page.screenshot();
                testInfo.attach('cr1-simple-results', {
                    body: screenshot,
                    contentType: 'image/png'
                });
            }
            
        } catch (error) {
            console.error(`${await currentTime()} - [CR1.1-Simple] ❌ Test failed: ${error}`);
            
            // Screenshot on failure
            try {
                const screenshot = await page.screenshot();
                testInfo.attach('cr1-simple-failure', {
                    body: screenshot,
                    contentType: 'image/png'
                });
            } catch (screenshotError) {
                console.error(`${await currentTime()} - Failed to take screenshot: ${screenshotError}`);
            }
            
            throw error;
        }
    });
});