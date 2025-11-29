import { Page } from '@playwright/test';
import { BasePage } from './base-page';
import { LocatorDef, getElement } from '../utils/locator-utility';
import { currentTime } from '../utils/time-utility';
import { ProductLocators } from '../utils/locators-loader';

export class EbayProductPage extends BasePage {
  // Centralized locators from data/locators.json
  readonly productTitle: LocatorDef[] = ProductLocators.productTitle();
  readonly productPrice: LocatorDef[] = ProductLocators.productPrice();
  readonly addToCartButton: LocatorDef[] = ProductLocators.addToCartButton();
  readonly buyNowButton: LocatorDef[] = ProductLocators.buyNowButton();
  readonly productCondition: LocatorDef[] = ProductLocators.productCondition();
  readonly quantityInput: LocatorDef[] = ProductLocators.quantityInput();
  readonly productImage: LocatorDef[] = ProductLocators.productImage();
  readonly sellerInfo: LocatorDef[] = ProductLocators.sellerInfo();
  readonly sellerName: LocatorDef[] = ProductLocators.sellerName();
  readonly sellerRating: LocatorDef[] = ProductLocators.sellerRating();
  readonly shippingInfo: LocatorDef[] = ProductLocators.shippingInfo();
  readonly itemSpecifics: LocatorDef[] = ProductLocators.itemSpecifics();
  readonly productDescription: LocatorDef[] = ProductLocators.productDescription();
  readonly watchlistButton: LocatorDef[] = ProductLocators.watchlistButton();
  readonly shareButton: LocatorDef[] = ProductLocators.shareButton();
  readonly contactSellerButton: LocatorDef[] = ProductLocators.contactSellerButton();
  readonly returnPolicyLink: LocatorDef[] = ProductLocators.returnPolicyLink();

  constructor(page: Page) {
    super(page);
  }

  async getProductTitle(): Promise<string> {
    console.log(`${await currentTime()} - [product] Get product title`);
    const locator = await this.getLocator(this.productTitle);
    return await locator.textContent() || '';
  }

  async addToCart() {
    console.log(`${await currentTime()} - [cart] Clicking add to cart button...`);
    await this.click(this.addToCartButton);
    console.log(`${await currentTime()} - [cart] ✅ Add to cart button clicked`);
  }

  async buyNow() {
    console.log(`${await currentTime()} - [product] Clicking buy now button...`);
    await this.click(this.buyNowButton);
    console.log(`${await currentTime()} - [product] ✅ Buy now button clicked`);
  }

  async setQuantity(quantity: string) {
    console.log(`${await currentTime()} - [product] Setting quantity to: ${quantity}`);
    await this.type(this.quantityInput, quantity);
    console.log(`${await currentTime()} - [product] ✅ Quantity set`);
  }

  async addToWatchlist() {
    console.log(`${await currentTime()} - [EbayProductPage] Add to watchlist`);
    await this.click(this.watchlistButton);
  }

  async shareProduct() {
    console.log(`${await currentTime()} - [EbayProductPage] Share product`);
    await this.click(this.shareButton);
  }

  async contactSeller() {
    console.log(`${await currentTime()} - [EbayProductPage] Contact seller`);
    await this.click(this.contactSellerButton);
  }

  async getProductPrice(): Promise<string> {
    console.log(`${await currentTime()} - [EbayProductPage] Get product price`);
    const locator = await this.getLocator(this.productPrice);
    return await locator.textContent() || '';
  }

  async getSellerInfo(): Promise<string> {
    console.log(`${await currentTime()} - [EbayProductPage] Get seller info`);
    const locator = await this.getLocator(this.sellerName);
    return await locator.textContent() || '';
  }

  private async getLocator(locators: any) {
    const { getElement: getEl } = await import('../utils/locator-utility');
    return await getEl(this.page, locators, { timeout: this.defaultTimeout });
  }

  // ==================== Item-specific utilities ====================

  async selectRandomVariantIfAny() {
    console.log(`${await currentTime()} - [EbayProductPage] Select random variant if available`);
    // Try to find select elements and choose a random option
    const selects = await this.page.$$('select');
    for (const s of selects) {
      const options = await s.$$('option');
      if (options.length > 1) {
        const idx = Math.floor(Math.random() * (options.length - 1)) + 1;
        const val = await options[idx].getAttribute('value');
        if (val) await s.selectOption(val);
      }
    }
  }

  async addToCartV2(): Promise<void> {
    console.log(`${await currentTime()} - [product] Add to cart (v2) - starting...`);
    await this.selectRandomVariantIfAny();
    const locs: LocatorDef[] = [
      { type: 'css', value: '#atcRedesignId_btn' },
      { type: 'text', value: 'Add to cart' }
    ];
    
    console.log(`${await currentTime()} - [cart] Looking for add to cart button...`);
    const el = await getElement(this.page, locs, { timeout: 8000 });
    await el.click();
    console.log(`${await currentTime()} - [cart] Add to cart button clicked`);
    
    // Use domcontentloaded instead of networkidle (Playwright best practice)
    await this.page.waitForLoadState('domcontentloaded', { timeout: 5000 });
    
    // Wait for add-to-cart feedback (dialog, message, etc.)
    try {
      await this.page.waitForSelector('[data-testid="cart-dialog"], .cart-notification, .success-msg', { timeout: 3000 });
      console.log(`${await currentTime()} - [cart] ✅ Add to cart feedback detected`);
    } catch (error) {
      console.log(`${await currentTime()} - [cart] ⚠️ No add to cart feedback found but operation completed`);
    }
  }

  async getProductPriceAsNumber(): Promise<number | null> {
    console.log(`${await currentTime()} - [EbayProductPage] Get product price as number`);
    const locs: LocatorDef[] = [
      { type: 'css', value: '[itemprop="price"]' },
      { type: 'css', value: '.notranslate' }
    ];
    const el = await getElement(this.page, locs, { timeout: 5000 });
    const txt = (await el.textContent()) || '';
    const num = Number(txt.replace(/[^0-9\.]/g, ''));
    return Number.isNaN(num) ? null : num;
  }
}
