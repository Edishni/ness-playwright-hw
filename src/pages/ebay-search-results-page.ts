import { Page } from '@playwright/test';
import { BasePage } from './base-page';
import { LocatorDef } from '../utils/locator-utility';
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
    console.log(`${await currentTime()} - [EbaySearchResultsPage] Filter by price: ${minPrice} - ${maxPrice}`);
    await this.type(this.priceMinInput, minPrice);
    await this.type(this.priceMaxInput, maxPrice);
    await this.click(this.applyFiltersButton);
  }

  async sortBy(sortOption: string) {
    console.log(`${await currentTime()} - [EbaySearchResultsPage] Sort by: ${sortOption}`);
    await this.click(this.sortDropdown);
    // Select the sort option
  }

  async clickFirstProduct() {
    console.log(`${await currentTime()} - [EbaySearchResultsPage] Click first product`);
    await this.click(this.productTitle);
  }

  async goToNextPage() {
    console.log(`${await currentTime()} - [EbaySearchResultsPage] Go to next page`);
    await this.click(this.paginationNextButton);
  }

  async refineSearch(query: string) {
    console.log(`${await currentTime()} - [EbaySearchResultsPage] Refine search: ${query}`);
    await this.type(this.searchInput, query);
    await this.click(this.searchButton);
  }
}
