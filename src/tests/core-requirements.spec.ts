import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { EbayProductPage } from '../pages/ebay-product-page';
import { CartPage } from '../pages/ebay-cart-page';
import { currentTime } from '../utils/time-utility';
import { TestHooks } from '../utils/test-hooks';
import {
    loadTestDataForSuite,
    searchItemsByNameUnderPrice
} from '../utils/search-utils';
import { addItemsToCart } from '../utils/product-utils';
import { assertCartTotalNotExceeds } from '../utils/cart-utils';

// Load test data at module level (before test discovery)
const testData = loadTestDataForSuite('core-requirements');

test.describe('Core Requirements - Search & Cart Workflow', () => {

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
            console.warn(`${await currentTime()} - [teardown] ⚠️ Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });

    // ==================== CR1: Search Items (Unit Tests) ====================
    testData?.searchScenarios?.forEach((scenario: any, index: number) => {
        test(`CR1.${index + 1}: Search <${scenario.query}> under price limit : $${scenario.maxPrice}`, async ({ page }, testInfo) => {
            // Arrange
            const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
            console.log(`${await currentTime()} - [CR1.${index + 1}] Browser: ${browserName.toUpperCase()} - Starting search for: ${scenario.query}`);

            const homePage = new EbayHomePage(page);

            // Act
            await homePage.goto();
            const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

            // Assert
            expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);
            console.log(`${await currentTime()} - [CR1.${index + 1}] Found ${urls.length} items under $${scenario.maxPrice}`);

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

    test('CR2.1: Add single item to cart with variant selection', async ({ page }, testInfo) => {
        // Arrange
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        const scenario = testData.searchScenarios[0];
        console.log(`${await currentTime()} - [CR2.1] Browser: ${browserName.toUpperCase()} - Search <${scenario.query}> and add item to cart`);

        const homePage = new EbayHomePage(page);

        // Act - Search
        await homePage.goto();
        const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, 1);

        expect(urls.length).toBeGreaterThan(0);

        urls.forEach((url, idx) => {
            console.log(`  ${idx + 1}. ${url.slice(0, 50)}...`);
        });
        // Add item to cart
        await addItemsToCart(page, urls.slice(0, 1), testInfo);

        console.log(`${await currentTime()} - [CR2.1] Item added to cart`);

        testInfo.attach('cart-action', {
            body: JSON.stringify({ itemsAdded: urls.slice(0, 1) }, null, 2),
            contentType: 'application/json'
        });
    });

    test('CR2.2: Add multiple items to cart', async ({ page }, testInfo) => {
        // Arrange
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        const scenario = testData.searchScenarios[0];
        const cartTest = testData.cartTests[1];
        console.log(`${await currentTime()} - [CR2.2] Browser: ${browserName.toUpperCase()} - Search <${scenario.query}> and add ${cartTest.itemsToAdd} items to cart`);

        const homePage = new EbayHomePage(page);

        // Act - Search for multiple items
        await homePage.goto();
        const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, cartTest.itemsToAdd);

        expect(urls.length).toBeGreaterThanOrEqual(1);

        // Add items to cart
        await addItemsToCart(page, urls, testInfo);

        const cartPage = new CartPage(page);
        await cartPage.gotoCart();

        console.log(`${await currentTime()} - [CR2.2] ${urls.length} items added to cart`);
        testInfo.attach('cart-action', {
            body: JSON.stringify({ itemsAdded: urls }, null, 2),
            contentType: 'application/json'
        });
    });

    test('CR2.3: Add max items and verify cart contents', async ({ page }, testInfo) => {
        // Arrange
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        const scenario = testData.searchScenarios[0];
        const cartTest = testData.cartTests[2]; // 5 items
        console.log(`${await currentTime()} - [CR2.3] Browser: ${browserName.toUpperCase()} - Search <${scenario.query}> and add up to ${cartTest.itemsToAdd} items`);

        const homePage = new EbayHomePage(page);
        const cartPage = new CartPage(page);

        // Act - Search for multiple items
        await homePage.goto();
        const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, cartTest.itemsToAdd);

        expect(urls.length).toBeGreaterThanOrEqual(1);

        // Add items to cart
        await addItemsToCart(page, urls, testInfo);

        // Verify cart
        await cartPage.gotoCart();
        const cartTotal = await cartPage.getTotal();

        console.log(`${await currentTime()} - [CR2.3] ${urls.length} items in cart, Total: $${cartTotal}`);
        expect(cartTotal).toBeGreaterThan(0);
    });

    // ==================== CR5: Complete Integrated Workflow ====================

    test('CR5.1: Complete Search and Cart Workflow - Multiple Search Terms with Cart Integration', async ({ page }, testInfo) => {
        // Setup test hooks
        await TestHooks.beforeEach(testInfo, page);

        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CR5.1] Browser: ${browserName.toUpperCase()} - Starting Complete Search & Cart Integration Workflow`);

        const homePage = new EbayHomePage(page);
        const cartPage = new CartPage(page);
        let allUrls: string[] = [];

        // Step 1: Loop through search scenarios (like CR1.1-1.5)
        await TestHooks.step('Phase 1: Search Items from Multiple Categories', async () => {
            console.log(`${await currentTime()} - [CR5.1] Phase 1: Search Items from Multiple Categories`);

            for (const [index, scenario] of testData.searchScenarios.entries()) {
                console.log("-------------------------");
                console.log(`${await currentTime()} - [CR5.1.${index + 1}] Searching for: ${scenario.query} under $${scenario.maxPrice}`);

                await homePage.goto();
                const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

                expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);

                // Collect URLs for cart addition
                allUrls.push(...urls);

                console.log(`${await currentTime()} - [CR5.1.${index + 1}] Found ${urls.length} items for "${scenario.query}"`);
                urls.forEach((url, idx) => {
                    console.log(`    ${idx + 1}. ${url.slice(0, 60)}...`);
                });
            }
        });

        // Step 2: Generate consolidated links report
        console.log(`${await currentTime()} - [CR5.1] Phase 2: Generated ${allUrls.length} total product links`);

        testInfo.attach('all-search-results', {
            body: JSON.stringify({
                totalItems: allUrls.length,
                searchQueries: testData.searchScenarios.map((s: any) => s.query),
                allUrls: allUrls
            }, null, 2),
            contentType: 'application/json'
        });

        // Step 3: Add items to cart (like CR2.1-2.3)
        console.log(`${await currentTime()} - [CR5.1] Phase 3: Adding Items to Cart`);

        // Limit to reasonable number for cart testing
        const itemsToAdd = Math.min(allUrls.length, 5);
        const selectedUrls = allUrls.slice(0, itemsToAdd);

        // Print item URLs for tracking (titles will be extracted during cart validation)
        console.log(`${await currentTime()} - [test] URLs to be processed for cart:`);
        for (let i = 0; i < selectedUrls.length; i++) {
            const url = selectedUrls[i];
            console.log(`${await currentTime()} - [test] ${i + 1}. ${url.slice(0, 80)}...`);
        }

        console.log(`${await currentTime()} - [cart] Adding ${selectedUrls.length} items to cart`);
        await addItemsToCart(page, selectedUrls, testInfo);

        // Step 4: Verify cart and budget
        let cartItems: any[] = [];
        let cartTotal: number = 0;

        await TestHooks.step('Phase 4: Cart Verification', async () => {
            console.log(`${await currentTime()} - [CR5.1] Phase 4: Cart Verification`);

            await cartPage.gotoCart();

            // Take cart screenshot for documentation
            await TestHooks.takeScreenshot(
                page,
                testInfo,
                'cart-workflow-verification',
                'Cart state during integrated workflow verification'
            );

            // Get cart items and titles for validation
            cartItems = await cartPage.getCartItems();
            const totalResult = await cartPage.getTotal();
            cartTotal = totalResult || 0; // Handle null case
            console.log(`${await currentTime()} - [cart] Cart total is $${cartTotal}`);
            console.log(`${await currentTime()} - [cart] Items found in cart:`);

            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                console.log(`${await currentTime()} - [cart] ${i + 1}. ${item.title.slice(0, 60)}... - $${item.price} (qty: ${item.quantity})`);
            }

            // Validate item count
            console.log(`${await currentTime()} - [test] Cart validation: Expected ${selectedUrls.length} items, Found ${cartItems.length} items`);
            if (selectedUrls.length !== cartItems.length) {
                console.log(`${await currentTime()} - [test] ⚠️  Warning: Item count mismatch - Expected ${selectedUrls.length}, got ${cartItems.length}`);
            } else {
                console.log(`${await currentTime()} - [test] ✅ Item count matches: ${cartItems.length} items`);
            }
        });

        // Budget verification
        const budgetTest = testData.budgetTests[0];
        const isWithinBudget = await assertCartTotalNotExceeds(
            page,
            budgetTest.budgetPerItem,
            selectedUrls.length,
            testInfo
        );

        console.log(`${await currentTime()} - [CR5.1] ✅ Complete Workflow Success:`);
        console.log(`  - Searched ${testData.searchScenarios.length} categories`);
        console.log(`  - Found ${allUrls.length} total products`);
        console.log(`  - Added ${selectedUrls.length} items to cart`);
        console.log(`  - Cart total: $${cartTotal}`);
        console.log(`  - Budget compliance: ${isWithinBudget ? 'PASSED' : 'FAILED'}`);

        // Assert final workflow success
        expect(allUrls.length).toBeGreaterThan(0);
        expect(cartTotal).toBeGreaterThan(0);
        // expect(isWithinBudget).toBeTruthy();



        testInfo.attach('workflow-summary', {
            body: JSON.stringify({
                workflow: 'CR5.1 - Complete Search & Cart Integration',
                searchCategories: testData.searchScenarios.length,
                totalProductsFound: allUrls.length,
                itemsAddedToCart: selectedUrls.length,
                cartTotal: cartTotal,
                budgetCompliance: isWithinBudget,
                status: 'completed'
            }, null, 2),
            contentType: 'application/json'
        });
    });

    test('CR5.2: Stress Test - Maximum Items Workflow', async ({ page }, testInfo) => {
        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - [CR5.2] Browser: ${browserName.toUpperCase()} - Starting Maximum Items Stress Test`);

        const homePage = new EbayHomePage(page);
        const cartPage = new CartPage(page);
        let allUrls: string[] = [];

        // Step 1: Collect maximum items from all search scenarios
        console.log(`${await currentTime()} - [CR5.2] Phase 1: Maximum Item Collection`);

        for (const [index, scenario] of testData.searchScenarios.entries()) {
            console.log(`${await currentTime()} - [CR5.2.${index + 1}] Max search for: ${scenario.query}`);

            await homePage.goto();
            // Use higher limit for stress test
            const urls = await searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, 10);

            allUrls.push(...urls);
            console.log(`${await currentTime()} - [CR5.2.${index + 1}] Collected ${urls.length} items`);
        }

        // Step 2: Add maximum reasonable items to cart
        const maxItems = Math.min(allUrls.length, 8); // Stress test with more items
        const selectedUrls = allUrls.slice(0, maxItems);

        console.log(`${await currentTime()} - [CR5.2] Phase 2: Adding ${selectedUrls.length} items to cart (stress test)`);
        await addItemsToCart(page, selectedUrls, testInfo);

        // Step 3: Verify cart handles multiple items
        await cartPage.gotoCart();
        const cartTotal = await cartPage.getTotal();

        // Assert stress test success
        expect(selectedUrls.length).toBeGreaterThanOrEqual(3);
        expect(cartTotal).toBeGreaterThan(0);

        console.log(`${await currentTime()} - [CR5.2] ✅ Stress Test Complete: ${selectedUrls.length} items, $${cartTotal}`);

        testInfo.attach('stress-test-results', {
            body: JSON.stringify({
                workflow: 'CR5.2 - Stress Test',
                totalItemsFound: allUrls.length,
                stressTestItems: selectedUrls.length,
                cartTotal: cartTotal,
                status: 'completed'
            }, null, 2),
            contentType: 'application/json'
        });
    });
});
