import { Page } from '@playwright/test';
import { BasePage } from './base-page';
import { LocatorDef, getElement } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';
import { CommonLocators, SearchResultsLocators } from '../utils/locators-loader';

export class EbaySearchResultsPage extends BasePage {
  // Centralized locators from data/locators.json
  readonly searchInput: LocatorDef[] = CommonLocators.searchInput();
  readonly searchButton: LocatorDef[] = CommonLocators.searchButton();

  readonly priceMinInput: LocatorDef[] = SearchResultsLocators.minPriceInput();
  readonly priceMaxInput: LocatorDef[] = SearchResultsLocators.maxPriceInput();
  readonly applyFiltersButton: LocatorDef[] = SearchResultsLocators.applyFiltersButton();
  readonly filterSidebar: LocatorDef[] = SearchResultsLocators.filterSidebar();
  readonly sortDropdown: LocatorDef[] = SearchResultsLocators.sortDropdown();
  readonly paginationNextButton: LocatorDef[] = SearchResultsLocators.paginationNextButton();

  // Map old property names to new centralized locators for backward compatibility
  readonly productList: LocatorDef[] = SearchResultsLocators.resultItem();
  readonly productTitle: LocatorDef[] = SearchResultsLocators.itemTitle();
  readonly productPrice: LocatorDef[] = SearchResultsLocators.itemPrice();
  readonly productRating: LocatorDef[] = SearchResultsLocators.itemRating();
  readonly freeShippingBadge: LocatorDef[] = SearchResultsLocators.freeShippingBadge();
  readonly resultsCount: LocatorDef[] = SearchResultsLocators.resultItem();
  readonly viewOptions: LocatorDef[] = SearchResultsLocators.filterSidebar();

  constructor(page: Page) {
    super(page);
  }

  async filterByPriceRange(minPrice: string, maxPrice: string) {
    console.log(`${await currentTime()} - [filter] Setting price range filter: $${minPrice} - $${maxPrice}`);
    
    try {
      console.log(`${await currentTime()} - [filter] Filling price input fields...`);
      // Clear and fill price inputs
      await this.clearAndType(this.priceMinInput, minPrice);
      await this.clearAndType(this.priceMaxInput, maxPrice);
      console.log(`${await currentTime()} - [filter] ✅ Price inputs filled`);
      
      // Wait for eBay's validation to process (element-based wait)
      try {
        await this.page.waitForFunction(() => {
          const minInput = document.querySelector('input[placeholder*="Min"], input[aria-label*="minimum"]');
          const maxInput = document.querySelector('input[placeholder*="Max"], input[aria-label*="maximum"]');
          return minInput && maxInput && !minInput.classList.contains('error') && !maxInput.classList.contains('error');
        }, { timeout: 3000 });
        console.log(`${await currentTime()} - [filter] ✅ Input validation completed`);
      } catch (error) {
        console.log(`${await currentTime()} - [filter] ⚠️ Input validation check timed out - continuing...`);
      }
      
      console.log(`${await currentTime()} - [filter] Applying price filter...`);
      // Try to click the apply button with multiple strategies
      await this.clickApplyButtonWithFallback();
      console.log(`${await currentTime()} - [filter] ✅ Price filter applied`);
      
    } catch (error) {
      console.log(`${await currentTime()} - [filter] ❌ Price filter failed: ${error}`);
      throw error;
    }
  }

  private async clearAndType(locators: LocatorDef[], text: string) {
    const element = await getElement(this.page, locators);
    await element.clear();
    await element.fill(text);
    // Trigger change event
    await element.press('Tab');
  }

  private async clickApplyButtonWithFallback() {
    console.log(`${await currentTime()} - [filter] Attempting to click Apply button with smart fallback...`);
    
    // Strategy 1: Try priceRangeApplyButton first (more specific)
    const priceRangeApplyButton = SearchResultsLocators.priceRangeApplyButton();
    if (await this.tryClickApplyButton(priceRangeApplyButton, "priceRangeApplyButton")) {
      return;
    }
    
    // Strategy 2: Try generic applyFiltersButton
    if (await this.tryClickApplyButton(this.applyFiltersButton, "applyFiltersButton")) {
      return;
    }
    
    // Strategy 3: Force interaction to wake up the button
    console.log(`${await currentTime()} - [filter] Trying force interaction to wake up Apply button...`);
    await this.forceWakeUpApplyButton();
    
    // Strategy 4: Final attempt after wake up
    if (await this.tryClickApplyButton(priceRangeApplyButton, "priceRangeApplyButton (after wakeup)")) {
      return;
    }
    
    throw new Error("All Apply button strategies failed");
  }

  private async tryClickApplyButton(locators: LocatorDef[], buttonName: string): Promise<boolean> {
    try {
      const element = await getElement(this.page, locators);
      
      // Check if button exists and is visible
      if (!(await element.isVisible())) {
        console.log(`${await currentTime()} - [filter] ${buttonName} not visible, skipping...`);
        return false;
      }
      
      // Check if button is enabled
      const isEnabled = await element.isEnabled();
      console.log(`${await currentTime()} - [filter] ${buttonName} enabled: ${isEnabled}`);
      
      if (isEnabled) {
        await element.click();
        console.log(`${await currentTime()} - [filter] ✅ Successfully clicked ${buttonName}`);
        return true;
      } else {
        console.log(`${await currentTime()} - [filter] ${buttonName} is disabled, trying to enable it...`);
        
        // Try to enable the button by refocusing inputs
        await this.refocusPriceInputs();
        await this.page.waitForTimeout(500);
        
        // Check again after refocus
        const isEnabledAfterRefocus = await element.isEnabled();
        if (isEnabledAfterRefocus) {
          await element.click();
          console.log(`${await currentTime()} - [filter] ✅ Successfully clicked ${buttonName} after refocus`);
          return true;
        } else {
          console.log(`${await currentTime()} - [filter] ${buttonName} still disabled after refocus`);
          return false;
        }
      }
      
    } catch (error) {
      console.log(`${await currentTime()} - [filter] ${buttonName} attempt failed: ${error}`);
      return false;
    }
  }

  private async forceWakeUpApplyButton() {
    try {
      // Force interaction with price inputs to trigger eBay's validation
      console.log(`${await currentTime()} - [filter] Force waking up Apply button...`);
      
      const minInput = await getElement(this.page, this.priceMinInput);
      const maxInput = await getElement(this.page, this.priceMaxInput);
      
      // Multiple interaction attempts to wake up the button
      await minInput.focus();
      await this.page.waitForTimeout(200);
      await minInput.press('End');
      await this.page.waitForTimeout(200);
      await maxInput.focus();
      await this.page.waitForTimeout(200);
      await maxInput.press('End');
      await this.page.waitForTimeout(200);
      
      // Trigger change events
      await minInput.press('Tab');
      await maxInput.press('Tab');
      
      // Wait for eBay's validation
      await this.page.waitForTimeout(1000);
      
      console.log(`${await currentTime()} - [filter] Force wake up completed`);
      
    } catch (error) {
      console.log(`${await currentTime()} - [filter] Force wake up failed: ${error}`);
    }
  }

  private async refocusPriceInputs() {
    try {
      const minInput = await getElement(this.page, this.priceMinInput);
      const maxInput = await getElement(this.page, this.priceMaxInput);
      
      await minInput.focus();
      await minInput.press('Tab');
      await maxInput.focus();
      await maxInput.press('Tab');
      
    } catch (error) {
      console.log(`${await currentTime()} - [filter] Refocus failed: ${error}`);
    }
  }

  async sortBy(sortOption: string) {
    console.log(`${await currentTime()} - [filter] Sort by: ${sortOption}`);
    await this.click(this.sortDropdown);
    // Select the sort option
  }

  async clickFirstProduct() {
    console.log(`${await currentTime()} - [nav] Click first product`);
    await this.click(this.productTitle);
  }

  async goToNextPage() {
    console.log(`${await currentTime()} - [nav] Go to next page`);
    await this.click(this.paginationNextButton);
  }

  async refineSearch(query: string) {
    console.log(`${await currentTime()} - [search] Refine search: ${query}`);
    await this.type(this.searchInput, query);
    await this.click(this.searchButton);
  }
}
