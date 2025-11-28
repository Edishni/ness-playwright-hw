import { Locator } from '@playwright/test';
import { BasePage } from './base-page';
import { LocatorDef, getElement } from '../utils/locator-utility';
import { CartLocators } from '../utils/locators-loader';

export class CartPage extends BasePage {
  constructor(page: any) { super(page); }

  async gotoCart() { await this.goto('https://cart.ebay.com/'); await this.page.waitForLoadState('networkidle', { timeout: 10000 });; }

  async getTotal(): Promise<number | null> {
    const locs: LocatorDef[] = CartLocators.cartSubtotal();
    const el = await getElement(this.page, locs, { timeout: 8000 });
    const txt = (await el.textContent()) || '';
    const num = Number(txt.replace(/[^0-9\.]/g, ''));
    return Number.isNaN(num) ? null : num;
  }
}
