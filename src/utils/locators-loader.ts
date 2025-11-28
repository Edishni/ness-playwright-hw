import fs from 'fs';
import path from 'path';
import { LocatorDef } from './locator-utility';

export interface LocatorsData {
  common: Record<string, LocatorDef[]>;
  searchResults: Record<string, LocatorDef[]>;
  product: Record<string, LocatorDef[]>;
  cart: Record<string, LocatorDef[]>;
  variants: Record<string, LocatorDef[]>;
  fallback: Record<string, LocatorDef[]>;
}

/**
 * Centralized Locators Loader
 * Loads locators from data/locators.json for data-driven testing
 * Benefits: Easy updates, version control friendly, reusable across tools
 */
class LocatorsLoader {
  private locators: LocatorsData | null = null;

  private loadLocators(): LocatorsData {
    if (this.locators) {
      return this.locators;
    }

    const filePath = path.resolve(process.cwd(), 'data/locators.json');
    if (!fs.existsSync(filePath)) {
      throw new Error(`Locators file not found: ${filePath}`);
    }

    const data = fs.readFileSync(filePath, 'utf8');
    this.locators = JSON.parse(data) as LocatorsData;
    return this.locators;
  }

  public getLocators(section: keyof LocatorsData, key: string): LocatorDef[] {
    const data = this.loadLocators();
    if (!data[section] || !data[section][key]) {
      throw new Error(`Locator not found: ${section}.${key}`);
    }
    return data[section][key];
  }

  public getSection(section: keyof LocatorsData): Record<string, LocatorDef[]> {
    const data = this.loadLocators();
    if (!data[section]) {
      throw new Error(`Section not found: ${section}`);
    }
    return data[section];
  }

  public getAll(): LocatorsData {
    return this.loadLocators();
  }
}

export const locatorsLoader = new LocatorsLoader();

export const CommonLocators = {
  searchInput: () => locatorsLoader.getLocators('common', 'searchInput'),
  searchButton: () => locatorsLoader.getLocators('common', 'searchButton'),
  cartLink: () => locatorsLoader.getLocators('common', 'cartLink'),
  signInButton: () => locatorsLoader.getLocators('common', 'signInButton'),
  myEbayLink: () => locatorsLoader.getLocators('common', 'myEbayLink')
};

export const SearchResultsLocators = {
  resultsContainer: () => locatorsLoader.getLocators('searchResults', 'resultsContainer'),
  resultItem: () => locatorsLoader.getLocators('searchResults', 'resultItem'),
  itemLink: () => locatorsLoader.getLocators('searchResults', 'itemLink'),
  itemPrice: () => locatorsLoader.getLocators('searchResults', 'itemPrice'),
  itemPriceRange: () => locatorsLoader.getLocators('searchResults', 'itemPriceRange'),
  itemTitle: () => locatorsLoader.getLocators('searchResults', 'itemTitle'),
  itemCondition: () => locatorsLoader.getLocators('searchResults', 'itemCondition'),
  itemRating: () => locatorsLoader.getLocators('searchResults', 'itemRating'),
  itemImage: () => locatorsLoader.getLocators('searchResults', 'itemImage'),
  freeShippingBadge: () => locatorsLoader.getLocators('searchResults', 'freeShippingBadge'),
  filterSidebar: () => locatorsLoader.getLocators('searchResults', 'filterSidebar'),
  minPriceInput: () => locatorsLoader.getLocators('searchResults', 'minPriceInput'),
  maxPriceInput: () => locatorsLoader.getLocators('searchResults', 'maxPriceInput'),
  priceRangeContainer: () => locatorsLoader.getLocators('searchResults', 'priceRangeContainer'),
  priceRangeApplyButton: () => locatorsLoader.getLocators('searchResults', 'priceRangeApplyButton'),
  applyFiltersButton: () => locatorsLoader.getLocators('searchResults', 'applyFiltersButton'),
  sortDropdown: () => locatorsLoader.getLocators('searchResults', 'sortDropdown'),
  paginationNextButton: () => locatorsLoader.getLocators('searchResults', 'paginationNextButton')
};

export const ProductLocators = {
  productTitle: () => locatorsLoader.getLocators('product', 'productTitle'),
  productPrice: () => locatorsLoader.getLocators('product', 'productPrice'),
  addToCartButton: () => locatorsLoader.getLocators('product', 'addToCartButton'),
  buyNowButton: () => locatorsLoader.getLocators('product', 'buyNowButton'),
  productCondition: () => locatorsLoader.getLocators('product', 'productCondition'),
  quantityInput: () => locatorsLoader.getLocators('product', 'quantityInput'),
  productImage: () => locatorsLoader.getLocators('product', 'productImage'),
  sellerInfo: () => locatorsLoader.getLocators('product', 'sellerInfo'),
  sellerName: () => locatorsLoader.getLocators('product', 'sellerName'),
  sellerRating: () => locatorsLoader.getLocators('product', 'sellerRating'),
  shippingInfo: () => locatorsLoader.getLocators('product', 'shippingInfo'),
  itemSpecifics: () => locatorsLoader.getLocators('product', 'itemSpecifics'),
  productDescription: () => locatorsLoader.getLocators('product', 'productDescription'),
  watchlistButton: () => locatorsLoader.getLocators('product', 'watchlistButton'),
  shareButton: () => locatorsLoader.getLocators('product', 'shareButton'),
  contactSellerButton: () => locatorsLoader.getLocators('product', 'contactSellerButton'),
  returnPolicyLink: () => locatorsLoader.getLocators('product', 'returnPolicyLink')
};

export const CartLocators = {
  cartContainer: () => locatorsLoader.getLocators('cart', 'cartContainer'),
  cartItem: () => locatorsLoader.getLocators('cart', 'cartItem'),
  cartItemTitle: () => locatorsLoader.getLocators('cart', 'cartItemTitle'),
  cartItemPrice: () => locatorsLoader.getLocators('cart', 'cartItemPrice'),
  cartSubtotal: () => locatorsLoader.getLocators('cart', 'cartSubtotal'),
  cartTotal: () => locatorsLoader.getLocators('cart', 'cartTotal'),
  proceedToCheckoutButton: () => locatorsLoader.getLocators('cart', 'proceedToCheckoutButton'),
  removeItemButton: () => locatorsLoader.getLocators('cart', 'removeItemButton'),
  continueShoppingButton: () => locatorsLoader.getLocators('cart', 'continueShoppingButton'),
  addedToCartDialog: () => locatorsLoader.getLocators('cart', 'addedToCartDialog'),
  addedToCartHeader: () => locatorsLoader.getLocators('cart', 'addedToCartHeader'),
  dialogCloseButton: () => locatorsLoader.getLocators('cart', 'dialogCloseButton'),
  dialogParentFromHeader: () => locatorsLoader.getLocators('cart', 'dialogParentFromHeader'),
  closeButtonWithinDialog: () => locatorsLoader.getLocators('cart', 'closeButtonWithinDialog'),
  cartBadgeCount: () => locatorsLoader.getLocators('cart', 'cartBadgeCount')
};

export const VariantLocators = {
  variantSelectButton: () => locatorsLoader.getLocators('variants', 'variantSelectButton'),
  variantSelectButtonLabel: () => locatorsLoader.getLocators('variants', 'variantSelectButtonLabel'),
  variantDropdownOpen: () => locatorsLoader.getLocators('variants', 'variantDropdownOpen'),
  variantFirstOption: () => locatorsLoader.getLocators('variants', 'variantFirstOption'),
  variantAllOptions: () => locatorsLoader.getLocators('variants', 'variantAllOptions'),
  variantOptionValue: () => locatorsLoader.getLocators('variants', 'variantOptionValue'),
  sizeSelect: () => locatorsLoader.getLocators('variants', 'sizeSelect'),
  sizeButton: () => locatorsLoader.getLocators('variants', 'sizeButton'),
  colorButton: () => locatorsLoader.getLocators('variants', 'colorButton'),
  colorInput: () => locatorsLoader.getLocators('variants', 'colorInput'),
  quantitySelect: () => locatorsLoader.getLocators('variants', 'quantitySelect'),
  materialSelect: () => locatorsLoader.getLocators('variants', 'materialSelect'),
  styleSelect: () => locatorsLoader.getLocators('variants', 'styleSelect')
};

export const FallbackLocators = {
  addToCartButtons: () => locatorsLoader.getLocators('fallback', 'addToCartButtons'),
  cartButtons: () => locatorsLoader.getLocators('fallback', 'cartButtons'),
  cartTotalElements: () => locatorsLoader.getLocators('fallback', 'cartTotalElements')
};
