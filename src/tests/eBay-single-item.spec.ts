import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { currentTime } from '../utils/time-utility';
import { loadTestDataForSuite } from '../utils/test-details';

// Load test data at module level (before test discovery)
const testData = loadTestDataForSuite('core-requirements');

test.describe('eBay web shop - unitTests ', () => {

    // Setup teardown to close all pages and context after each test
    test.afterEach(async ({ page }, testInfo) => {
        try {
            console.log(`${await currentTime()} - [teardown] Starting cleanup for test: ${testInfo.title}`);

            // Close all pages in the context
            const context = page.context();
            const pages = context.pages();

            console.log(`${await currentTime()} - [teardown] Closing ${pages.length} page(s)...`);

            for (const p of pages) {
                if (!p.isClosed()) {
                    await p.close();
                }
            }

            console.log(`${await currentTime()} - [teardown] ✅ All pages closed successfully`);

        } catch (error) {
            console.warn(`${await currentTime()} - [teardown] ❌ Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ==================== Search Items (Unit Tests) ====================
    testData?.searchScenarios?.forEach((scenario: any, index: number) => {
        test(`${index + 1}: Search <${scenario.query}> under price limit : ${scenario.maxPrice}`, async ({ page }, testInfo) => {
            // Arrange
            const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
            console.log(`${await currentTime()} - [${index + 1}] Browser: ${browserName.toUpperCase()} - Starting search for: ${scenario.query}`);

            const homePage = new EbayHomePage(page);

            // Act
            await homePage.goto();
            const urls = await homePage.searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

            // Assert
            expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);
            console.log(`${await currentTime()} - [${index + 1}] Found ${urls.length} items under ${scenario.maxPrice}`);

            urls.forEach((url, idx) => {
                console.log(`  ${idx + 1}. ${url.slice(0, 50)}...`);
            });

            // Log results
            testInfo.attach('search-results', {
                body: JSON.stringify(urls, null, 2),
                contentType: 'application/json'
            });
        });
    });

});
