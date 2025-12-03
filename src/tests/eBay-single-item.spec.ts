import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { EbayProductPage } from '../pages/ebay-product-page';
import { CartPage } from '../pages/ebay-cart-page';
import { currentTime } from '../utils/time-utility';
import { TestHooks } from '../utils/test-hooks';
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

            // console.log(`${await currentTime()} - [teardown] Closing ${pages.length} page(s)...`);

            // for (const p of pages) {
            //     if (!p.isClosed()) {
            //         await p.close();
            //     }
            // }

            console.log(`${await currentTime()} - [teardown] ✅ All pages closed successfully`);

        } catch (error) {
            console.warn(`${await currentTime()} - [teardown] ❌ Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ==================== CR1: Search Items (Unit Tests) ====================
    testData?.searchScenarios?.forEach((scenario: any, index: number) => {
        test(`CR1.${index + 1}: Search <${scenario.query}> under price limit : ${scenario.maxPrice}`, async ({ page }, testInfo) => {
            // Arrange
            const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
            console.log(`${await currentTime()} - [CR1.${index + 1}] Browser: ${browserName.toUpperCase()} - Starting search for: ${scenario.query}`);

            const homePage = new EbayHomePage(page);

            // Act
            await homePage.goto();
            const urls = await homePage.searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

            // Assert
            expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);
            console.log(`${await currentTime()} - [CR1.${index + 1}] Found ${urls.length} items under ${scenario.maxPrice}`);

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

    // ==================== CR2: Add to Cart (Unit Tests) ====================

    test('CR2: Add single item to cart with variant selection', async ({ page }, testInfo) => {
        // Arrange
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        const scenario = testData.searchScenarios[0];
        console.log(`${await currentTime()} - [CR21] Browser: ${browserName.toUpperCase()} - Search <${scenario.query}> and add item to cart`);

        const homePage = new EbayHomePage(page);

        // Act - Search
        await homePage.goto();
        const urls = await homePage.searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, 1);

        expect(urls.length).toBeGreaterThan(0);

        urls.forEach((url, idx) => {
            console.log(`  ${idx + 1}. ${url.slice(0, 50)}...`);
        });
        // Add item to cart
        const productPage = new EbayProductPage(page);
        await productPage.addItemsToCart(page, urls.slice(0, 1), testInfo);

        console.log(`${await currentTime()} - [CR2] Item added to cart`);
        const cartPage = new CartPage(page);
        await cartPage.gotoCart();
        const cartTotal = await cartPage.getTotal();

        console.log(`${await currentTime()} - [CR2] ${urls.length} items in cart, Total: ${cartTotal}`);
        expect(cartTotal).toBeGreaterThan(0);
        testInfo.attach('cart-action', {
            body: JSON.stringify({ itemsAdded: urls.slice(0, 1) }, null, 2),
            contentType: 'application/json'
        });
    });

});
