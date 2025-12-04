import { test, expect, Locator, Page } from '@playwright/test';
import { EbayHomePage } from '../pages/ebay-home-page';
import { EbayProductPage } from '../pages/ebay-product-page';
import { CartPage } from '../pages/ebay-cart-page';
import { currentTime } from '../utils/time-utility';
import { TestHooks } from '../utils/test-hooks';
import { loadTestDataForSuite } from '../utils/test-details';

const testData = loadTestDataForSuite('core-requirements');

test.describe('eBay web shop - Human-like Workflow', () => {

    test.beforeAll(async ({ browser }) => {
        console.log("============= Browser details =================");
        const version = browser.version();
        const browserName = browser.browserType().name();
        console.log(`Browser: ${browserName}, Version: ${version}`);
    });

    // Setup teardown to close all pages and context after each test
    test.afterEach(async ({ page }, testInfo) => {
        try {
            console.log(`${await currentTime()} - [teardown] Starting cleanup for test: ${testInfo.title}`);
            // Close all pages in the context
            const context = page.context();
            const pages = context.pages();

            console.log(`${await currentTime()} - [teardown] Closing ${pages.length} page(s)...`);

            for (const p of pages) {
                if (!p.isClosed()) { await p.close(); }
            }
            console.log(`${await currentTime()} - [teardown] ✅ All pages closed successfully`);
        } catch (error) {
            console.warn(`${await currentTime()} - [teardown] ❌ Error during cleanup: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    });
    // for end big loop
    let allUrls: {
        element: Locator;
        href: string;
        title: string;
        price: string;
    }[] = [];
    // Step 1: Loop through search scenarios
    test('Complete Search and Cart Workflow ', async ({ page, context }, testInfo) => {
        // Setup test hooks
        await TestHooks.beforeEach(testInfo, page);

        const browserName = testInfo.project.name || page.context().browser()?.browserType().name() || 'unknown';
        console.log(`${await currentTime()} - Browser: ${browserName.toUpperCase()} - Starting Complete Search & Cart Integration Workflow`);

        const homePage = new EbayHomePage(page);



        // Step 1: Loop through search scenarios 
        await TestHooks.step('Phase 1: Search Items from Multiple Categories', async () => {
            console.log(`${await currentTime()} - Phase 1: Search Items from Multiple Categories`);
            await homePage.goto();
            for (const [index, scenario] of testData.searchScenarios.entries()) {
                console.log("-------------------------");
                console.log(`${await currentTime()} - [${index + 1}] Searching for: ${scenario.query} under ${scenario.maxPrice}`);

                const urls = await homePage.searchItemsByNameUnderPrice(page, scenario.query, scenario.maxPrice, scenario.limit);

                expect(urls.length).toBeGreaterThanOrEqual(scenario.expectedMinResults);

                // Collect URLs for cart addition
                allUrls.push(...urls);
                // for inner loop array of selected elements from page after search
                let innerElmList: {
                    element: Locator;
                    href: string;
                    title: string;
                    price: string;
                }[] = [];
                // collect for inner loop
                innerElmList.push(...urls);
                console.log(`${await currentTime()} - [${index + 1}] Found ${urls.length} items for "${scenario.query}"`);
                urls.forEach((url, idx) => {
                    console.log(`    ${idx + 1}. ${url.title.slice(0, 60)}...`);
                    console.log(`    ${url.href.slice(0, 60)}...`);
                    console.log(`    ${url.price}`);

                });

                console.log(`${await currentTime()} - Phase 2: Generated ${innerElmList.length} inner loop for product list`);

                testInfo.attach('item-search-results', {
                    body: JSON.stringify({
                        totalItems: innerElmList.length,
                        searchQueries: testData.searchScenarios.map((s: any) => s.query),
                        innerElmList: innerElmList
                    }, null, 2),
                    contentType: 'application/json'
                });

                // Limit to reasonable number for cart testing
                const itemsToAdd = Math.min(innerElmList.length, 5);
                const selectedUrls = innerElmList.slice(0, itemsToAdd);

                // const context = page.context();
                for (let i = 0; i < selectedUrls.length; i++) {
                    const itemLink = selectedUrls[i];

                    // 1. Start waiting for a new page
                    const pagePromise = context.waitForEvent('page', { timeout: 15000 });

                    // 2. Perform the click
                    await itemLink.element.click({ modifiers: ['Control'] });

                    // 3. Await the new page
                    let newPage: Page | null;
                    try {
                        newPage = await pagePromise;
                        console.warn(`${await currentTime()} - [new tab] ✅ New tab opened for item: ${itemLink.title}`);
                    } catch {
                        console.warn(`${await currentTime()} - [new tab] ❌ No new tab opened for item: ${itemLink.title}`);
                        continue;
                    }


                    await newPage.waitForLoadState('domcontentloaded');
                    // Add to cart using POM
                    const productPage = new EbayProductPage(newPage);
                    await productPage.addSingleItemToCart(newPage, i, itemLink, testInfo);

                    // Close item tab and return to search results
                    await newPage.close();
                    await page.bringToFront();
                    await page.waitForLoadState('domcontentloaded');
                }
            }
        });
        // Step 3: Validate cart contents and budget
        console.log(`${await currentTime()} - Phase 3: Validating Cart Contents and Budget Compliance`);
        // Go to cart and validate
        const cartPage = new CartPage(page);
        await cartPage.gotoCart();
        let cartItems: any[] = [];
        let cartTotal: number = 0;
        cartItems = await cartPage.getCartItems();
        cartTotal = (await cartPage.getTotal()) || 0;

        // Budget check
        const budgetTest = testData.budgetTests[0];
        const isWithinBudget = await cartPage.validateCartTotalNotExceeds(
            budgetTest.budgetPerItem,
            cartItems.length,
            testInfo
        );

        // Summary
        console.log(`${await currentTime()} - [workflow] ✅ Human-like workflow completed`);
        console.log(`  - Searched ${testData.searchScenarios.length} categories`);
        console.log(`  - Found ${allUrls.length} total products`);
        console.log(`  - Added ${cartItems.length} items to cart`);
        console.log(`  - Cart total: ${cartTotal}`);
        console.log(`  - Valid budget: ${budgetTest.budgetPerItem * cartItems.length}`);
        console.log(`  - Budget compliance: ${isWithinBudget ? '✅ PASSED' : '❌ FAILED'}`);
        expect(cartItems.length).toBeGreaterThan(0);
        expect(cartTotal).toBeGreaterThan(0);

        testInfo.attach('human-workflow-summary', {
            body: JSON.stringify({
                workflow: 'Human-like Search & Cart Integration',
                itemsAddedToCart: cartItems.length,
                cartTotal: cartTotal,
                budgetCompliance: isWithinBudget,
                status: 'completed'
            }, null, 2),
            contentType: 'application/json'
        });
    });
});