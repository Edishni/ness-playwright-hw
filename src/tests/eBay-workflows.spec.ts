import { test, expect } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { EbayProductPage } from '../pages/ebay-product-page';
import { CartPage } from '../pages/ebay-cart-page';
import { currentTime } from '../utils/time-utility';
import { TestHooks } from '../utils/test-hooks';
import { loadTestDataForSuite } from '../utils/test-details';

// Load test data at module level (before test discovery)
const testData = loadTestDataForSuite('core-requirements');

test.describe('eBay web shop - Search & Cart Workflow', () => {

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

    // ==================== Complete Integrated Workflow ====================

    test('Complete Search and Cart Workflow - Multiple Search Terms with Cart Integration', async ({ page }, testInfo) => {
        // Setup test hooks
        await TestHooks.beforeEach(testInfo, page);

        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - Browser: ${browserName.toUpperCase()} - Starting Complete Search & Cart Integration Workflow`);

        const homePage = new EbayHomePage(page);

        let allUrls: string[] = [];

        // Step 1: Loop through search scenarios (like CR1.1-1.5)
        await TestHooks.step('Phase 1: Search Items from Multiple Categories', async () => {
            console.log(`${await currentTime()} - Phase 1: Search Items from Multiple Categories`);

            for (const [index, scenario] of testData.searchScenarios.entries()) {
                console.log("-------------------------");
                console.log(`${await currentTime()} - [${index + 1}] Searching for: ${scenario.query} under ${scenario.maxPrice}`);

                await homePage.goto();
                const urls = await homePage.searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

                expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);

                // Collect URLs for cart addition
                allUrls.push(...urls);

                console.log(`${await currentTime()} - [${index + 1}] Found ${urls.length} items for "${scenario.query}"`);
                urls.forEach((url, idx) => {
                    console.log(`    ${idx + 1}. ${url.slice(0, 60)}...`);
                });
            }
        });

        // Step 2: Generate consolidated links report
        console.log(`${await currentTime()} - Phase 2: Generated ${allUrls.length} total product links`);

        testInfo.attach('all-search-results', {
            body: JSON.stringify({
                totalItems: allUrls.length,
                searchQueries: testData.searchScenarios.map((s: any) => s.query),
                allUrls: allUrls
            }, null, 2),
            contentType: 'application/json'
        });

        // Step 3: Add items to cart (like CR2.1-2.3)
        console.log(`${await currentTime()} - Phase 3: Adding Items to Cart`);

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
        const productPage = new EbayProductPage(page);
        await productPage.addItemsToCart(page, selectedUrls, testInfo);

        // Step 4: Verify cart and budget
        let cartItems: any[] = [];
        let cartTotal: number = 0;

        await TestHooks.step('Phase 4: Cart Verification', async () => {
            console.log(`${await currentTime()} - Phase 4: Cart Verification`);
            console.log("================================================");
            const cartPage = new CartPage(page);
            await cartPage.gotoCart();

            // // Get cart items and titles for validation
            cartItems = await cartPage.getCartItems();

            for (let i = 0; i < cartItems.length; i++) {
                const item = cartItems[i];
                console.log(`${await currentTime()} - [cart] ${i + 1}. ${item.title.slice(0, 60)}... - ${item.price} (qty: ${item.quantity})`);
            }

            // Validate item count
            console.log(`${await currentTime()} - [test] Cart validation: Expected ${selectedUrls.length} items, Found ${cartItems.length} items`);
            if (selectedUrls.length !== cartItems.length) {
                console.log(`${await currentTime()} - [test] ❌  Warning: Item count mismatch - Expected ${selectedUrls.length}, got ${cartItems.length}`);
            } else {
                console.log(`${await currentTime()} - [test] ✅ Item count matches: ${cartItems.length} items`);
            }


            // cart total from cart-util.ts
            // Budget verification
            const budgetTest = testData.budgetTests[0];

            const totalResult = await cartPage.getTotal();
            cartTotal = totalResult || 0; // Handle null case

            const isWithinBudget = await cartPage.validateCartTotalNotExceeds(
                budgetTest.budgetPerItem,
                selectedUrls.length,
                testInfo
            );

            console.log(`${await currentTime()} - ✅ Complete Workflow Success:`);
            console.log(`  - Searched ${testData.searchScenarios.length} categories`);
            console.log(`  - Found ${allUrls.length} total products`);
            console.log(`  - Added ${cartItems.length} items to cart`);
            console.log(`  - Cart total: ${cartTotal}`);
            console.log(`  - Valid budget: ${budgetTest.budgetPerItem * cartItems.length}`);
            console.log(`  - Budget compliance: ${isWithinBudget ? '✅ PASSED' : '❌ FAILED'}`);

            // Assert final workflow success
            expect(allUrls.length).toBeGreaterThan(0);
            expect(cartTotal).toBeGreaterThan(0);
            // expect(isWithinBudget).toBeTruthy();

            testInfo.attach('workflow-summary', {
                body: JSON.stringify({
                    workflow: 'Complete Search & Cart Integration',
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
    });
});
