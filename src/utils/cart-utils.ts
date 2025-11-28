import { Page } from '@playwright/test';
import { LocatorDef } from './locator-utility';
import { getElement } from './locator-utility';
import { FallbackLocators } from './locators-loader';
import { currentTime } from './time-utility';

/**
 * Verify cart total does not exceed budget
 * @param page - Playwright page object
 * @param budgetPerItem - Budget per item
 * @param itemsCount - Number of items in cart
 * @param testInfo - Test info for attaching screenshots
 * @returns Promise<boolean> - True if cart total is within budget
 */
export async function assertCartTotalNotExceeds(
    page: Page,
    budgetPerItem: number,
    itemsCount: number,
    testInfo?: any
): Promise<boolean> {
    try {
        // Navigate to cart using centralized cart button locators
        const cartLocs: LocatorDef[] = FallbackLocators.cartButtons();

        const cartBtn = await getElement(page, cartLocs, {
            timeout: 5000
        }).catch(() => null);

        if (cartBtn) {
            await cartBtn.click();
          await page.waitForLoadState('networkidle', { timeout: 10000 });
        }

        // Extract cart total using centralized cart total locators from configuration
        const cartTotalLocs: LocatorDef[] = FallbackLocators.cartTotalElements();

        let cartTotal = 0;

        // Try each locator strategy until one succeeds
        for (const locDef of cartTotalLocs) {
            const totalElement = await getElement(page, [locDef], {
                timeout: 3000
            }).catch(() => null);

            if (totalElement) {
                try {
                    const totalText = await totalElement.textContent({ timeout: 3000 });
                    if (totalText) {
                        cartTotal = parseFloat(totalText.replace(/[^0-9\.]/g, ''));
                        if (!isNaN(cartTotal)) {
                            console.log(`Found cart total: $${cartTotal}`);
                            break; // Found valid total, stop trying
                        }
                    }
                } catch (e) {
                    console.warn(`${await currentTime()} - Could not extract text from total element: ${e instanceof Error ? e.message : 'Unknown error'}`);
                }
            }
        }

        const expectedMax = budgetPerItem * itemsCount;
        const isWithinBudget = cartTotal <= expectedMax;

        if (testInfo) {
            const screenshot = await page.screenshot();
            testInfo.attach('cart-verification', {
                body: screenshot,
                contentType: 'image/png'
            });
        }

        console.log(
            `Cart Total: $${cartTotal}, Budget Max: $${expectedMax}, Within Budget: ${isWithinBudget}`
        );

        return isWithinBudget;
    } catch (error) {
        console.error(
            `Cart verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return false;
    }
}
