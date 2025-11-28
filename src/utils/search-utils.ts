import { Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LocatorDef } from './locator-utility';
import { getElement } from './locator-utility';
import { EbayHomePage } from '../pages/ebay-home-page';
import { SearchResultsLocators } from './locators-loader';
import { isPriceWithinBudget } from './ebay-price-extractor';
import { currentTime } from './time-utility';

/**
 * Set price range filters on search results page
 * @param page - Playwright page object
 * @param minPrice - Minimum price (optional)
 * @param maxPrice - Maximum price (optional)
 * @returns Promise<boolean> - true if price range was set successfully
 */
export async function setPriceRange(
    page: Page,
    minPrice?: number,
    maxPrice?: number
): Promise<boolean> {
    try {
        console.log(`${await currentTime()} - Setting price range: Min=${minPrice || 'none'}, Max=${maxPrice || 'none'}`);
        
        // Get both min and max input fields directly (skip container search)
        const minPriceInputLocators = SearchResultsLocators.minPriceInput();
        const maxPriceInputLocators = SearchResultsLocators.maxPriceInput();
        
        const minInput = await getElement(page, minPriceInputLocators, { timeout: 5000 }).catch(() => null);
        const maxInput = await getElement(page, maxPriceInputLocators, { timeout: 5000 }).catch(() => null);
        
        if (!minInput || !maxInput) {
            console.warn(`${await currentTime()} - Price input fields not found: Min=${!!minInput}, Max=${!!maxInput}`);
            return false;
        }
        
        console.log(`${await currentTime()} - Both price input fields found`);
        
        // Scroll inputs into view if needed
        try {
            await minInput.scrollIntoViewIfNeeded({ timeout: 3000 });
            await maxInput.scrollIntoViewIfNeeded({ timeout: 3000 });
            console.log(`${await currentTime()} - Price inputs scrolled into view`);
        } catch (scrollError) {
            console.warn(`${await currentTime()} - Failed to scroll inputs into view: ${scrollError instanceof Error ? scrollError.message : 'Unknown error'}`);
        }
        
        // Clear existing values and set new ones
        if (minPrice !== undefined) {
            await minInput.clear();
            await minInput.fill(minPrice.toString());
            await page.waitForTimeout(100);
            await minInput.click({button: "left"}); // Click to focus and wake up the form
            console.log(`${await currentTime()} - Set minimum price: ${minPrice}`);
        }
        
        if (maxPrice !== undefined) {
            await maxInput.clear();
            await maxInput.fill(maxPrice.toString());
            await page.waitForTimeout(100);
            await minInput.click({button: "left"});
            console.log(`${await currentTime()} - Set maximum price: ${maxPrice}`);
        }
        
        // Find and click apply button
        const applyButtonLocators = SearchResultsLocators.priceRangeApplyButton();
        const applyButton = await getElement(page, applyButtonLocators, { timeout: 3000 }).catch(() => null);
        
        if (!applyButton) {
            console.warn(`${await currentTime()} - Apply button not found`);
            return false;
        }

        // Scroll button into view and click
        await applyButton.scrollIntoViewIfNeeded();
        await applyButton.click();
        console.log(`${await currentTime()} - Clicked apply button`);
        
        // Wait for page to fully restart/reload with new filters
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.waitForTimeout(3000); // Extra wait for filter results to stabilize
        
        console.log(`${await currentTime()} - Page restarted with price filter applied`);
        return true;
        
    } catch (error) {
        console.error(`${await currentTime()} - Error setting price range: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

export async function searchItemsByNameUnderPrice(
    page: Page,
    query: string,
    maxPrice: number,
    limit = 5
): Promise<string[]> {
    // Simple flow: use site search, apply price filter, collect links
    const inputLocs: LocatorDef[] = new EbayHomePage(page).searchInput;
    const buttonLocs: LocatorDef[] = new EbayHomePage(page).searchButton;

    // Fill search input and click search button
    await getElement(page, inputLocs, { timeout: 5000 }).then(l => l.fill(query));
    await getElement(page, buttonLocs, { timeout: 5000 }).then(l => l.click());
    await page.waitForLoadState('networkidle');
    
    // Apply price range filter with maxPrice
    console.log(`${await currentTime()} - Applying price filter: Max $${maxPrice}`);
    const priceFilterApplied = await setPriceRange(page, undefined, maxPrice);
    
    if (priceFilterApplied) {
        console.log(`${await currentTime()} - Price filter applied successfully`);
    } else {
        console.warn(`${await currentTime()} - Price filter failed, continuing with manual filtering`);
    }

    // Collect items with price filtering across multiple pages
    const links: string[] = [];
    let currentPage = 1;
    const maxPages = 10; // Safety limit to prevent infinite loops

    // Build selector strings from centralized locators (use first CSS selector from array)
    const resultsContainerSelector = SearchResultsLocators.resultsContainer()[0].value;
    const resultItemSelector = SearchResultsLocators.resultItem()[0].value;
    const searchResultsSelector = `${resultsContainerSelector} ${resultItemSelector}`;

    while (links.length < limit && currentPage <= maxPages) {
        console.log(`${await currentTime()} - Processing page ${currentPage}...`);

        await page.locator(searchResultsSelector).first()
            .waitFor({ state: 'visible', timeout: 10000 })
            .catch(async () => {
                console.warn(`${await currentTime()} - No search results found on page ${currentPage}`);
            });

        // Get all items as array of locators using locator API (not page.$$)
        const items = await page.locator(searchResultsSelector).all();
        console.log(`${await currentTime()} - Found ${items.length} items on page ${currentPage}`);

        // Get selector strings for item link and price
        const itemLinkSelector = SearchResultsLocators.itemLink()[0].value;
        const itemPriceSelector = SearchResultsLocators.itemPrice()[0].value;
        const itemTitleSelector = SearchResultsLocators.itemTitle()[0].value;

        for (const itemLocator of items) {
            if (links.length >= limit) break;
            console.log(`----------------`);
            try {

                // Extract and print item title
                const titleLocator = itemLocator.locator(itemTitleSelector).first();
                const titleText = await titleLocator
                    .textContent({ timeout: 3000 })
                    .catch(() => null);

                if (titleText) {
                    console.log(`${await currentTime()} - Item title: ${titleText.trim().slice(0,40)}...`);
                }

                const linkLocator = itemLocator.locator(itemLinkSelector).first();

                // Wait until the link is attached
                await linkLocator.waitFor();

                // Get href using locator.getAttribute instead of $eval - use centralized locators
                console.log(`${await currentTime()} - Extracting item link and price: ${itemLinkSelector}`);
                let href = await linkLocator
                    .getAttribute('href', { timeout: 3000 })
                    .catch(() => null);

                if (!href) {
                    href = await linkLocator.evaluate((el: HTMLAnchorElement) => el.href);
                    console.log(`${await currentTime()} - Fallback href extraction: \n${href.slice(0, 100)}..`);
                }

                if (!href) continue;

                // Try to get all price spans under the item
                const priceLocator = itemLocator.locator(itemPriceSelector);

                let finalPriceText: string | null = null;

                try {
                    // Collect all matching texts (handles single or multiple spans)
                    const texts: (string | null)[] = await priceLocator.allTextContents();

                    if (texts.length === 1) {
                        // Case 1: single price
                        finalPriceText = texts[0];
                    } else if (texts.length > 1) {
                        // Case 2: multiple spans (price range)
                        // Join with spaces to preserve "to" if it's a separate span
                        finalPriceText = texts.filter(Boolean).join(" ");
                    }

                    console.log(`${await currentTime()} - Extracted price text: ${finalPriceText}`);
                } catch (err) {
                    console.error(`${await currentTime()} - Failed to extract price text`, err);
                }

                // Case 3: no price found
                if (!finalPriceText) {
                    console.log(`${await currentTime()} - Price not found...`);
                }

                // Filter by price using specialized extraction utility
                if (finalPriceText) {
                    const isWithinBudget = isPriceWithinBudget(finalPriceText, maxPrice);
                    if (!isWithinBudget) {
                        continue; // Skip items over budget
                    }
                }

                links.push(href);
            } catch (error) {
                console.warn(`${await currentTime()} - Could not extract item data: ${error instanceof Error ? error.message : 'Unknown error'}`);
                continue; // Skip this item, try next
            }
        }

        // Check if we have enough items or need to go to next page
        if (links.length >= limit) {
            console.log(`${await currentTime()} - Collected ${links.length} items, target reached`);
            break;
        }

        // Try to navigate to next page
        const nextButtonLocators = SearchResultsLocators.paginationNextButton();
        const nextButton = await getElement(page, nextButtonLocators, { timeout: 3000 }).catch(() => null);

        if (!nextButton) {
            console.log(`${await currentTime()} - No next page button found, stopping at ${links.length} items`);
            break;
        }

        try {
            console.log(`${await currentTime()} - Clicking next page button...`);
            
            // Wait for navigation to start (URL change or network activity)
            await Promise.all([
                page.waitForURL(/[?&]_pgn=\d+/, { timeout: 5000 }).catch(() => {}),
                nextButton.click({ timeout: 3000 })
            ]);
            
            // Wait for results to load on new page
            await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
            currentPage++;
            
            // Wait for new items to appear
            await page.locator(searchResultsSelector).first()
                .waitFor({ state: 'visible', timeout: 5000 })
                .catch(() => {});
            
            await page.waitForTimeout(1000); // Stabilization delay
            console.log(`${await currentTime()} - Successfully navigated to page ${currentPage}`);
        } catch (error) {
            console.warn(`${await currentTime()} - Failed to navigate to next page: ${error instanceof Error ? error.message : 'Unknown error'}`);
            break;
        }
    }

    console.log(`${await currentTime()} - Total items collected: ${links.length} across ${currentPage} page(s)`);
    return links;
}

export function loadTestData(): any {
    const p = path.resolve(process.cwd(), 'data/test-data.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Load test data from external JSON files based on the test suite name
 * @param suiteName - Name of the test suite (e.g., 'ebay', 'advanced-search', 'search')
 * @returns Parsed test data from the corresponding JSON file
 */
export function loadTestDataForSuite(suiteName: string): any {
    const fileName = `${suiteName}-test-data.json`;
    const filePath = path.resolve(process.cwd(), `data/${fileName}`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Test data file not found: ${filePath}`);
    }

    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

/**
 * Get a specific test case data from a loaded test data suite
 * @param testData - The loaded test data object
 * @param testCaseId - The ID of the test case to retrieve
 * @returns The specific test case data or undefined if not found
 */
export function getTestCase(testData: any, testCaseId: string): any {
    if (!testData.testCases || !Array.isArray(testData.testCases)) {
        return undefined;
    }
    return testData.testCases.find((tc: any) => tc.id === testCaseId);
}

