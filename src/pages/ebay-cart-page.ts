import { BasePage } from './base-page';
import { LocatorDef, getElement } from '../utils/locator-utility';
import { CartLocators } from '../utils/locators-loader';
import { currentTime } from '../utils/time-utility';
import { allure } from 'allure-playwright';

export interface ItemFromCart {
  title: string;
  price: string;
  quantity: number;
}

export class CartPage extends BasePage {
  constructor(page: any) { super(page); }

  async gotoCart(): Promise<void> {
    console.log(`${await currentTime()} - [cart] Navigating to cart page`);
    await super.goto('https://cart.ebay.com/');

    // Use domcontentloaded instead of networkidle (Playwright best practice)
    await this.page.waitForLoadState('domcontentloaded', { timeout: 10000 });

    // Wait for cart content to be ready
    try {
      await this.page.waitForSelector('[data-testid="cart-bucket"], .cart-bucket, #mainContent', { timeout: 8000 });
      console.log(`${await currentTime()} - [cart] ✅ Cart page loaded and content ready`);
    } catch (error) {
      console.log(`${await currentTime()} - [cart] ❌ Cart content check timed out but page loaded - continuing...`);
    }
  }

  /**
   * Validates that the cart total does not exceed the allowed budget.
   * Navigates to cart if needed, waits for content, and attaches screenshot.
   * Returns true if within budget, false otherwise.
   */
  async validateCartTotalNotExceeds(
    budgetPerItem: number,
    expectedItemsCount: number,
    testInfo?: any
  ): Promise<boolean> {
    try {
      this.takeCartScreenshot(testInfo);

      // Extract cart total
      const total = await this.getTotal();
      if (total === null) {
        console.log(`${await currentTime()} - [cart] ❌ Could not extract cart total`);
        return false;
      }

      // Extract cart items
      const items = await this.getCartItems();
      const actualCount = items.length;

      // print out items list in cart with prices and quantity
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        console.log(`${await currentTime()} - [cart] ${i + 1}. ${item.title.slice(0, 60)}... - ${item.price} (qty: ${item.quantity})`);
      }
      // Calculate expected max
      const expectedMax = budgetPerItem * expectedItemsCount;
      const isWithinBudget = total <= expectedMax;

      console.log(
        `[cart] Cart Total: ${total}, Budget Max: ${expectedMax}, Items: ${actualCount}, Expected: ${expectedItemsCount}, Within Budget: ${isWithinBudget}`
      );

      return isWithinBudget;
    } catch (error) {
      console.error(
        `[cart] Cart validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      return false;
    }
  }

  /**
   * Take cart page screenshot as required
   */
  async takeCartScreenshot(testInfo?: any): Promise<void> {
    try {
      const timestamp = await currentTime();
      const screenshotName = `cart-page-${timestamp.replace(/[:.\s]/g, '-')}.png`;

      console.log(`${timestamp} - [screenshot cart] Taking cart page screenshot...`);

      const screenshot = await this.page.screenshot({
        fullPage: true,
        path: `test-results/screenshots/${screenshotName}`
      });

      // Attach screenshot if testInfo provided
      if (testInfo) {
        //const screenshot = await this.page.screenshot();
        console.log(`${await currentTime()} - [screenshot cart] Attaching cart screenshot to test report`);
        testInfo.attach('cart-verification', {
          body: screenshot,
          contentType: 'image/png'
        });
      }

      console.log(`${timestamp} - [screenshot cart] ✅ Cart screenshot saved: ${screenshotName}`);
    } catch (error) {
      console.log(`${await currentTime()} - [screenshot cart] ❌ Failed to take cart screenshot: ${error}`);
    }
  }

  async getTotal(): Promise<number | null> {
    const locs: LocatorDef[] = CartLocators.cartSubtotal();
    const el = await getElement(this.page, locs, { timeout: 8000 });
    const txt = (await el.textContent()) || '';
    const num = Number(txt.replace(/[^0-9\.]/g, ''));
    return Number.isNaN(num) ? null : num;
  }

  async getCartItems(): Promise<ItemFromCart[]> {
    console.log(`${await currentTime()} - [cart] Extracting cart items...`);

    try {
      // Get cart item locators from centralized source
      const cartItemLocators = CartLocators.cartItem();
      const cartItemTitleLocators = CartLocators.cartItemTitle();
      const cartItemPriceLocators = CartLocators.cartItemPrice();
      const cartItemQuantityLocators = CartLocators.cartItemQuantity();

      // Try to find cart items using smart locator strategy
      let items: ItemFromCart[] = [];

      for (const locatorDef of cartItemLocators) {
        try {
          console.log(`${await currentTime()} - [locator] trying ${locatorDef.type}=${locatorDef.value}`);

          // const elements = await this.page.$$(locatorDef.value);
          // if (elements.length > 0) {

          const elements = await this.page.locator(locatorDef.value).all();
          if (elements.length > 0) {
            console.log(`${await currentTime()} - [locator] success: found ${elements.length} cart items`);

            for (let i = 0; i < elements.length; i++) {
              const element = elements[i];

              // Extract title using centralized locators
              let title = 'Unknown Title';
              for (const titleLocator of cartItemTitleLocators) {
                try {
                  const titleElement = await element.locator(titleLocator.value);
                  if (titleElement) {
                    const titleText = await titleElement.textContent();
                    if (titleText?.trim()) {
                      title = titleText.trim();
                      break;
                    }
                  }
                } catch (e) {
                  // Continue to next locator
                }
              }

              // Extract price using centralized locators
              let price = '0';
              for (const priceLocator of cartItemPriceLocators) {
                try {
                  const priceElement = await element.locator(priceLocator.value);
                  if (priceElement) {
                    const priceText = await priceElement.textContent();
                    if (priceText?.trim()) {
                      price = priceText.replace(/[^0-9\.]/g, '') || '0';
                      break;
                    }
                  }
                } catch (e) {
                  // Continue to next locator
                }
              }

              // Extract quantity using centralized locators
              let quantity = 1;
              for (const quantityLocator of cartItemQuantityLocators) {
                try {
                  const quantityElement = await element.locator(quantityLocator.value);
                  if (quantityElement) {
                    const quantityText = await quantityElement.textContent() || await quantityElement.inputValue();
                    if (quantityText?.trim()) {
                      quantity = parseInt(quantityText) || 1;
                      break;
                    }
                  }
                } catch (e) {
                  // Continue to next locator
                }
              }

              if (title !== 'Unknown Title') {
                items.push({ title, price, quantity });
              }
            }

            if (items.length > 0) break; // Found items, no need to try other locators
          }
        } catch (error) {
          console.log(`${await currentTime()} - [locator] failed: ${locatorDef.type}=${locatorDef.value}`);
          // Continue to next locator
        }
      }

      console.log(`${await currentTime()} - [cart] Successfully extracted ${items.length} cart items`);

      // Attach cart items to Allure if available
      if (typeof allure !== 'undefined' && items.length > 0) {
        await allure.attachment(
          'Cart Items Data',
          JSON.stringify(items, null, 2),
          'application/json'
        );
      }

      return items;

    } catch (error) {
      console.log(`${await currentTime()} - [cart] Error extracting cart items: ${error}`);
      return [];
    }
  }
}
