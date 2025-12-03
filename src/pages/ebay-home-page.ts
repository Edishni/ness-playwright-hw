import { Page, Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { getElement, LocatorDef } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';
import { CommonLocators, SearchResultsLocators } from '../utils/locators-loader';
import { isPriceWithinBudget } from '../utils/price-extractor';

export class EbayHomePage extends BasePage {
  // Centralized locators from data/locators.json
  readonly searchInput: LocatorDef[] = CommonLocators.searchInput();
  readonly searchButton: LocatorDef[] = CommonLocators.searchButton();

  // Cart link from centralized config
  readonly cartLink: LocatorDef[] = CommonLocators.cartLink();

  static searchButton: any;

  constructor(page: Page) {
    super(page);
  }

  async goto(url: string = 'https://www.ebay.com/') {
    await super.goto(url);
  }


  async searchItemsByNameUnderPrice(
    page: Page,
    query: string,
    maxPrice: number,
    limit = 5
  ): Promise<string[]> {
    console.log(`${await currentTime()} - [search] Starting search: "${query}" under ${maxPrice} (limit: ${limit})`);
    // Simple flow: use site search, apply price filter, collect links
    const inputLocs: LocatorDef[] = new EbayHomePage(page).searchInput;
    const buttonLocs: LocatorDef[] = new EbayHomePage(page).searchButton;

    console.log(`${await currentTime()} - [search] Filling search input and clicking search button...`);
    // Fill search input and click search button
    await getElement(page, inputLocs, { timeout: 5000 }).then(l => l.fill(query));
    await getElement(page, buttonLocs, { timeout: 5000 }).then(l => l.click());

    // Use domcontentloaded instead of networkidle (Playwright best practice)
    // networkidle is unreliable for dynamic sites like eBay with ongoing ads/tracking
    await page.waitForLoadState('domcontentloaded');

    // Add explicit wait for search results to appear (more reliable than networkidle)
    try {
      await page.waitForSelector('.srp-results, .s-results-list-atf', { timeout: 10000 });
      console.log(`${await currentTime()} - [search] ✅ Search completed, results container found`);
    } catch (error) {
      console.log(`${await currentTime()} - [search] ⚠️ Results container not found, but page loaded - continuing...`);
    }

    // Apply price range filter with maxPrice
    console.log(`${await currentTime()} - [filter] Applying price filter: Max ${maxPrice}`);
    const priceFilterApplied = await this.setPriceRange(page, undefined, maxPrice);

    if (priceFilterApplied) {
      console.log(`${await currentTime()} - [filter] Price filter applied successfully`);
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
      console.log(`${await currentTime()} - [search] Processing page ${currentPage}...`);

      await page.locator(searchResultsSelector).first()
        .waitFor({ state: 'visible', timeout: 10000 })
        .catch(async () => {
          console.warn(`${await currentTime()} - No search results found on page ${currentPage}`);
        });

      // Get all items as array of locators using locator API (not page.$$)
      const items = await page.locator(searchResultsSelector).all();
      console.log(`${await currentTime()} - [search] Found ${items.length} items on page ${currentPage}`);

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
            console.log(`${await currentTime()} - [search] Item title: ${titleText.trim().slice(0, 40)}...`);
          }

          const linkLocator = itemLocator.locator(itemLinkSelector).first();

          // Wait until the link is attached
          await linkLocator.waitFor();

          // Get href using locator.getAttribute instead of $eval - use centralized locators
          console.log(`${await currentTime()} - [search] Extracting item link and price: ${itemLinkSelector}`);
          let href = await linkLocator
            .getAttribute('href', { timeout: 3000 })
            .catch(() => null);

          if (!href) {
            href = await linkLocator.evaluate((el: HTMLAnchorElement) => el.href);
            console.log(`${await currentTime()} - [search] Fallback href extraction: \n${href.slice(0, 100)}..`);
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

            console.log(`${await currentTime()} - [search] Extracted price text: ${finalPriceText}`);
          } catch (err) {
            console.error(`${await currentTime()} - Failed to extract price text`, err);
          }

          // Case 3: no price found
          if (!finalPriceText) {
            console.log(`${await currentTime()} - [search] Price not found...`);
          }

          // Filter by price using specialized extraction utility
          if (finalPriceText) {
            const isWithinBudget = isPriceWithinBudget(finalPriceText, maxPrice);
            console.log(`${await currentTime()} - [price] Item price: ${finalPriceText} - ${isWithinBudget ? '✅ Within budget' : '❌ Over budget'}`);
            if (!isWithinBudget) {
              continue; // Skip items over budget
            }
          }

          console.log(`${await currentTime()} - [search] ✅ Item added to collection (${links.length + 1}/${limit})`);
          links.push(href);
        } catch (error) {
          console.warn(`${await currentTime()} - [search] ⚠️ Could not extract item data: ${error instanceof Error ? error.message : 'Unknown error'}`);
          continue; // Skip this item, try next
        }
      }

      // Check if we have enough items or need to go to next page
      if (links.length >= limit) {
        console.log(`${await currentTime()} - [search] Collected ${links.length} items, target reached`);
        break;
      }

      // Try to navigate to next page
      const nextButtonLocators = SearchResultsLocators.paginationNextButton();
      const nextButton = await getElement(page, nextButtonLocators, { timeout: 3000 }).catch(() => null);

      if (!nextButton) {
        console.log(`${await currentTime()} - [nav] No next page button found, stopping at ${links.length} items`);
        break;
      }

      try {
        console.log(`${await currentTime()} - [nav] Clicking next page button...`);

        // Wait for navigation to start (URL change or network activity)
        await Promise.all([
          page.waitForURL(/[?&]_pgn=\d+/, { timeout: 5000 }).catch(() => { }),
          nextButton.click({ timeout: 3000 })
        ]);

        // Wait for results to load on new page
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
        currentPage++;

        // Wait for new items to appear
        await page.locator(searchResultsSelector).first()
          .waitFor({ state: 'visible', timeout: 5000 })
          .catch(() => { });

        await page.waitForTimeout(1000); // Stabilization delay
        console.log(`${await currentTime()} - [nav] Successfully navigated to page ${currentPage}`);
      } catch (error) {
        console.warn(`${await currentTime()} - Failed to navigate to next page: ${error instanceof Error ? error.message : 'Unknown error'}`);
        break;
      }
    }

    console.log(`${await currentTime()} - [search] Total items collected: ${links.length} across ${currentPage} page(s)`);
    return links;
  }


  /**
   * Set price range filters on search results page
   * @param page - Playwright page object
   * @param minPrice - Minimum price (optional)
   * @param maxPrice - Maximum price (optional)
   * @returns Promise<boolean> - true if price range was set successfully
   */
  async setPriceRange(
    page: Page,
    minPrice?: number,
    maxPrice?: number
  ): Promise<boolean> {
    try {
      console.log(`${await currentTime()} - [filter] Setting price range: Min=${minPrice || 'none'}, Max=${maxPrice || 'none'}`);

      // Get both min and max input fields directly (skip container search)
      const minPriceInputLocators = SearchResultsLocators.minPriceInput();
      const maxPriceInputLocators = SearchResultsLocators.maxPriceInput();

      const minInput = await getElement(page, minPriceInputLocators, { timeout: 5000 }).catch(() => null);
      const maxInput = await getElement(page, maxPriceInputLocators, { timeout: 5000 }).catch(() => null);

      if (!minInput || !maxInput) {
        console.warn(`${await currentTime()} - Price input fields not found: Min=${!!minInput}, Max=${!!maxInput}`);
        return false;
      }

      console.log(`${await currentTime()} - [filter] Both price input fields found`);

      // Scroll inputs into view if needed
      try {
        await minInput.scrollIntoViewIfNeeded({ timeout: 3000 });
        await maxInput.scrollIntoViewIfNeeded({ timeout: 3000 });
        console.log(`${await currentTime()} - [filter] Price inputs scrolled into view`);
      } catch (scrollError) {
        console.warn(`${await currentTime()} - Failed to scroll inputs into view: ${scrollError instanceof Error ? scrollError.message : 'Unknown error'}`);
      }

      // Step 1: Set MAX price first if maxPrice is provided (most scenarios have maxPrice)
      if (maxPrice !== undefined) {
        console.log(`${await currentTime()} - [filter] Step 1: Setting maximum price: ${maxPrice}`);
        await maxInput.clear();
        await maxInput.fill(maxPrice.toString());
        await page.waitForTimeout(300); // Wait for field to update

        // Verify the value actually stuck and trigger form validation
        const actualMaxValue = await maxInput.inputValue();
        console.log(`${await currentTime()} - [filter] Max field value verification: "${actualMaxValue}"`);

        if (actualMaxValue !== maxPrice.toString()) {
          console.log(`${await currentTime()} - [filter] ⚠️ Max price value mismatch, retrying...`);
          await maxInput.focus();
          await maxInput.clear();
          await maxInput.fill(maxPrice.toString());
          await page.waitForTimeout(200);
        }

        // Trigger form validation by pressing Tab or Enter to "commit" the value
        await maxInput.press('Tab');
        await page.waitForTimeout(200);
        console.log(`${await currentTime()} - [filter] ✅ Max price set: ${maxPrice}`);
      }

      // Step 2: Set MIN price (even if not provided in test config, jump to min field as before)
      if (minPrice !== undefined) {
        console.log(`${await currentTime()} - [filter] Step 2: Setting minimum price: ${minPrice}`);
        await minInput.clear();
        await minInput.fill(minPrice.toString());
        await page.waitForTimeout(200);
        await minInput.press('Tab'); // Trigger validation
        console.log(`${await currentTime()} - [filter] ✅ Min price set: ${minPrice}`);
      } else {
        console.log(`${await currentTime()} - [filter] Step 2: No min price in test config, clicking min field to activate form`);
        await minInput.click({ button: "left" }); // Click min field to activate the form as before
        await page.waitForTimeout(200);
      }

      // Step 2.5: Verify submit button is enabled before clicking
      console.log(`${await currentTime()} - [filter] Checking if submit button is enabled...`);
      const applyButtonLocators = SearchResultsLocators.priceRangeApplyButton();
      const applyButton = await getElement(page, applyButtonLocators, { timeout: 3000 }).catch(() => null);

      if (!applyButton) {
        console.warn(`${await currentTime()} - Apply button not found`);
        return false;
      }

      // Check if button is enabled
      const isDisabled = await applyButton.getAttribute('disabled');
      if (isDisabled !== null) {
        console.warn(`${await currentTime()} - ❌ Submit button is DISABLED. Max: "${await maxInput.inputValue()}", Min: "${await minInput.inputValue()}"`);
        // Try one more time to activate the form by clicking both fields
        await maxInput.click();
        await page.waitForTimeout(100);
        await minInput.click();
        await page.waitForTimeout(300);

        const stillDisabled = await applyButton.getAttribute('disabled');
        if (stillDisabled !== null) {
          console.error(`${await currentTime()} - ❌ Submit button still disabled after retry`);
          return false;
        }
      }

      console.log(`${await currentTime()} - [filter] ✅ Submit button is enabled`);

      // Step 3: Apply the price range
      console.log(`${await currentTime()} - [filter] Step 3: Applying price range filter`);

      // Scroll button into view and click
      await applyButton.scrollIntoViewIfNeeded();
      await applyButton.click();
      console.log(`${await currentTime()} - [filter] Clicked apply button`);

      // Use domcontentloaded instead of networkidle (Playwright best practice)
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

      // Wait for filter to be applied - look for results to refresh
      try {
        await page.waitForFunction(() => {
          return document.querySelector('.srp-results, .s-results-list-atf') !== null;
        }, { timeout: 10000 });
        console.log(`${await currentTime()} - [nav] ✅ Price filter applied and results refreshed`);
      } catch (error) {
        console.log(`${await currentTime()} - [nav] ❌ Filter applied but results check timed out - continuing...`);
      }

      // Additional wait for filter stabilization
      await page.waitForTimeout(2000);

      console.log(`${await currentTime()} - [nav] ✅ Price filter process completed`);
      return true;

    } catch (error) {
      console.error(`${await currentTime()} - Error setting price range: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

}
