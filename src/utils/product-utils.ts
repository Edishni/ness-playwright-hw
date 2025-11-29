import { Page } from '@playwright/test';
import { LocatorDef } from './locator-utility';
import { getElement } from './locator-utility';
import { VariantLocators, FallbackLocators, CartLocators, ProductLocators } from './locators-loader';
import { currentTime } from './time-utility';

/**
 * Add items to cart from product URLs with optional variant selection
 * @param page - Playwright page object
 * @param urls - Array of product URLs to add to cart
 * @param testInfo - Test info for attaching screenshots
 * @returns Promise<void>
 */
export async function addItemsToCart(
    page: Page,
    urls: string[],
    testInfo?: any
): Promise<void> {
    for (const [index, url] of urls.entries()) {
        try {
            console.log(`${await currentTime()} - [product] Processing URL ${index + 1}/${urls.length}: ${url.slice(0, 50)}...`);

            // Use waitUntil: 'domcontentloaded' for better reliability
            await page.goto(url, { 
                waitUntil: 'domcontentloaded', 
                timeout: 15000 
            });
            
            // Wait for product page essentials to load
            try {
                await page.waitForSelector('#mainContent, .product-details, .notranslate', { timeout: 8000 });
                console.log(`${await currentTime()} - [product] ✅ Product page content loaded`);
            } catch (error) {
                console.log(`${await currentTime()} - [product] ⚠️ Product content check timed out but page loaded`);
            }

            // Select variants if available
            await selectRandomVariant(page);

            // Click "Add to Cart" button
            console.log(`${await currentTime()} - [cart] Looking for add to cart button...`);
            const addToCartBtn = await getElement(page, FallbackLocators.addToCartButtons(), { timeout: 7000 });

            if (!addToCartBtn) {
                console.log(`${await currentTime()} - [cart] ❌ Add to cart button not found`);
                throw new Error('Add to cart button not found');
            }

            await addToCartBtn.waitFor({ state: 'visible', timeout: 5000 });
            console.log(`${await currentTime()} - [cart] Add to cart button is visible`);

            const isEnabled = await addToCartBtn.isEnabled().catch(() => false);
            if (!isEnabled) {
                console.log(`${await currentTime()} - [cart] ❌ Add to cart button is disabled`);
                throw new Error('Add to cart button is disabled (possibly out of stock or missing variant selection)');
            }

            console.log(`${await currentTime()} - [cart] Clicking add to cart button...`);
            // Use a robust click
            await addToCartBtn.click({ timeout: 5000 });
            console.log(`${await currentTime()} - [cart] ✅ Add to cart button clicked`);

            // Validate item was added by checking dialog
            const wasAdded = await validateItemAdded(page);
            if (!wasAdded) {
                throw new Error('Item was not added to cart (dialog validation failed)');
            }

            console.log(`${await currentTime()} - [cart] Successfully added item from ${url.slice(0, 40)}...`);

            if (testInfo) {
                const screenshot = await page.screenshot();
                testInfo.attach(`cart-add-success-${index}`, {
                    body: screenshot,
                    contentType: 'image/png'
                });
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Unknown error';
            console.error(`${await currentTime()} - Failed to process URL ${url.slice(0, 70)}: ${errorMsg}`);
            // This error will be caught by the test runner, failing the test.
            // We throw it to ensure the test fails as expected.
            throw new Error(`Failed to add item from ${url.slice(0, 70)}: ${errorMsg}`);
        }
    }
}

/**
 * Select random variant options (size, color, quantity) if available
 * @param page - Playwright page object
 */
export async function selectRandomVariant(page: Page): Promise<void> {
    console.log(`${await currentTime()} - [variant] Starting variant selection process...`);
    try {
        // Use generic variant select button locator (finds any "Select" button: size, color, style, etc.)
        const variantButtonLocators = VariantLocators.variantSelectButton();
        const variantLabelLocators = VariantLocators.variantSelectButtonLabel();
        const variantFirstOptionLocators = VariantLocators.variantFirstOption();
        const variantOptionValue = VariantLocators.variantOptionValue();

        let totalSelected = 0;
        const maxAttempts = 5; // Prevent infinite loops
        console.log(`${await currentTime()} - [variant] Looking for variant selection buttons (max ${maxAttempts} attempts)...`);

        // Keep trying to find and click "Select" buttons until none are found
        while (totalSelected < maxAttempts) {
            let foundButton = false;

            // Find all "Select" buttons on the page (re-query each time to get fresh DOM state)
            for (const locatorDef of variantButtonLocators) {
                const selectButtons = await page.locator(locatorDef.value).all();

                if (selectButtons.length > 0) {
                    console.log(`${await currentTime()} - [variant] Found ${selectButtons.length} variant select button(s)`);

                    // Always click the FIRST "Select" button (after each selection, we re-query, so next button becomes first)
                    const button = selectButtons[0];
                    try {
                        // Extract and print the label text BEFORE clicking
                        const labelLocator = button.locator(variantLabelLocators[0].value);
                        const labelText = await labelLocator.textContent({ timeout: 2000 }).catch(() => null);

                        if (labelText) {
                            console.log(`${await currentTime()} - [variant] Found variant to select: "${labelText.trim()}"`);
                        } else {
                            console.log(`${await currentTime()} - [variant] Found variant button (no label text)`);
                        }

                        console.log(`${await currentTime()} - [variant] Clicking to open dropdown...`);
                        // Click to open dropdown
                        await button.waitFor({ state: 'visible', timeout: 3000 });
                        await button.click({ timeout: 3000 });
                        console.log(`${await currentTime()} - [variant] ✅ Dropdown clicked (attempt ${totalSelected + 1})`);

                        // Wait for dropdown to open and stabilize (longer wait to prevent dropdown from closing)
                        await page.waitForTimeout(1200);

                        // Verify dropdown actually opened
                        console.log(`${await currentTime()} - [variant] Verifying dropdown opened...`);
                        const dropdownLocators = VariantLocators.variantDropdownOpen();
                        const dropdown = await getElement(page, dropdownLocators, { timeout: 2000 }).catch(() => null);

                        if (!dropdown) {
                            console.warn(`${await currentTime()} - [variant] ⚠️ Dropdown did not open, will retry this variant`);
                            continue; // Try again from the beginning (will re-query and click same button)
                        }

                        console.log(`${await currentTime()} - [variant] ✅ Dropdown opened successfully`);
                        await page.waitForTimeout(300); // Let options render

                        // Now select an option from the opened dropdown
                        console.log(`${await currentTime()} - [variant] Selecting option from dropdown...`);
                        const optionClicked = await selectOptionFromOpenDropdown(page, dropdown);

                        if (!optionClicked) {
                            console.log(`${await currentTime()} - [variant] ⚠️ Option selection failed, checking if variant was selected...`);
                            // Option selection failed - check if variant was actually selected
                            const stillHasSelectButton = await page.locator(variantButtonLocators[0].value).count() > 0;
                            if (stillHasSelectButton) {
                                console.warn(`${await currentTime()} - [variant] ❌ 'Select' button still present - variant was NOT selected`);
                                throw new Error('Failed to select variant option - dropdown closed without selection');
                            }
                        } else {
                            console.log(`${await currentTime()} - [variant] ✅ Option selected successfully`);
                        }

                        foundButton = true;
                        totalSelected++;
                        break; // Exit locator loop, will re-query in next while iteration
                    } catch (e) {
                        console.warn(`${await currentTime()} - Could not interact with variant button: ${e instanceof Error ? e.message : 'Unknown error'}`);
                    }
                }
            }

            // If no more buttons found, we're done
            if (!foundButton) {
                console.log(`${await currentTime()} - [variant] ✅ No more variant select buttons found. Variant selection complete.`);
                console.log(`${await currentTime()} - [variant] 📊 Total variants selected: ${totalSelected}`);
                break;
            }
        }

        console.log(`${await currentTime()} - [variant] 🔄 Waiting for variant selection UI to update...`);
        // Wait for variant selection UI to update
        await page.waitForLoadState('domcontentloaded');
        console.log(`${await currentTime()} - [variant] ✅ Variant selection process completed successfully`);
    } catch (error) {
        console.warn(`${await currentTime()} - [variant] ⚠️ Variant selection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Variant selection is optional, continue if it fails
    }
}

/**
 * Select an option from an already-opened dropdown
 * @param page - Playwright page object
 * @param openDropdownElement - The open dropdown locator element
 * @returns Promise<boolean> - true if option was clicked successfully
 */
async function selectOptionFromOpenDropdown(page: Page, openDropdownElement: any): Promise<boolean> {
    const variantFirstOptionLocators = VariantLocators.variantFirstOption();
    const variantOptionValue = VariantLocators.variantOptionValue();
    const listboxLocators = VariantLocators.variantDropdownOpen();

    console.log(`${await currentTime()} - [variant] Selecting option from dropdown...`);

    // Try each option locator strategy
    for (const optionLocatorDef of variantFirstOptionLocators) {
        try {
            console.log(`${await currentTime()} - [variant] Trying locator: ${optionLocatorDef.value}`);

            // Find ALL listboxes in page (could be multiple from previous selections)
            const allListboxes = await page.locator(listboxLocators[0].value).all();
            console.log(`${await currentTime()} - [variant] Total listboxes in DOM: ${allListboxes.length}`);

            // Find the actively OPEN listbox (visible, not hidden, not disabled)
            let activeDropdown = null;
            for (const listbox of allListboxes) {
                const isVisible = await listbox.isVisible().catch(() => false);
                const ariaHidden = await listbox.getAttribute('aria-hidden').catch(() => null);
                const ariaDisabled = await listbox.getAttribute('aria-disabled').catch(() => null);

                // Active = visible AND not hidden AND not disabled
                if (isVisible && ariaHidden !== 'true' && ariaDisabled !== 'true') {
                    activeDropdown = listbox;
                    console.log(`${await currentTime()} - [variant] Found active dropdown (visible, not hidden, not disabled)`);
                    break;
                }
            }

            // Fallback: use last listbox if no active one found
            if (!activeDropdown) {
                console.warn(`${await currentTime()} - No active dropdown found, using last listbox as fallback`);
                activeDropdown = allListboxes[allListboxes.length - 1];
                if (!activeDropdown) {
                    console.warn(`${await currentTime()} - No listboxes found at all`);
                    continue;
                }
            }

            // Double-check: verify this dropdown actually has visible options before proceeding
            const allOptionsLocators = VariantLocators.variantAllOptions();
            const testOptions = await activeDropdown.locator(allOptionsLocators[0].value).all();
            let visibleCount = 0;
            for (const opt of testOptions) {
                if (await opt.isVisible().catch(() => false)) {
                    visibleCount++;
                }
            }
            console.log(`${await currentTime()} - [variant] Active dropdown has ${visibleCount} visible options (${testOptions.length} total)`);

            if (visibleCount === 0) {
                console.warn(`${await currentTime()} - Selected dropdown has no visible options, trying next locator...`);
                continue;
            }

            // Find all enabled options within the active dropdown
            const enabledOptionsInDropdown = activeDropdown.locator(optionLocatorDef.value);
            const optionCount = await enabledOptionsInDropdown.count();
            console.log(`${await currentTime()} - [variant] Found ${optionCount} enabled option(s) in active dropdown`);

            if (optionCount === 0) {
                console.warn(`${await currentTime()} - No enabled options found, trying next locator...`);
                continue;
            }

            if (optionCount === 1) {
                console.log(`${await currentTime()} - [variant] Only 1 enabled option found, no header present`);
            }

            // Skip first option (likely header at index 0) and take second (index 1)
            // If there's only 1 option, it means no header exists, so take index 0
            const targetIndex = optionCount > 1 ? 1 : 0;
            const targetOption = enabledOptionsInDropdown.nth(targetIndex);

            // Scroll into view
            await targetOption.scrollIntoViewIfNeeded({ timeout: 2000 }).catch(() => { });

            // Get option text
            const optionValueLocator = targetOption.locator(variantOptionValue[0].value);
            const optionText = await optionValueLocator.textContent({ timeout: 2000 }).catch(() => null);

            if (optionText) {
                console.log(`${await currentTime()} - [variant] Selecting option: ${optionText.trim()}`);
            }

            // Wait for option to be clickable before interacting
            await targetOption.waitFor({ state: 'visible', timeout: 2000 });

            // Click without force to ensure actionability
            await targetOption.evaluate((node: HTMLElement) => node.click());
            console.log(`${await currentTime()} - [variant] Successfully clicked option using evaluation`);

            // Wait for page to update after selection
            await page.waitForTimeout(1000);
            await page.waitForLoadState('domcontentloaded').catch(() => { });

            return true; // Success

        } catch (e) {
            console.warn(`${await currentTime()} - Failed with locator ${optionLocatorDef.value}: ${e instanceof Error ? e.message : 'Unknown error'}`);
            continue; // Try next locator
        }
    }

    console.error(`${await currentTime()} - Failed to select any option after trying all locators`);
    return false; // Failed
}

/**
 * Validate that item was successfully added to cart
 * Success = "Added to cart" dialog with correct header appears
 * @param page - Playwright page object
 * @returns true if item was added (dialog appeared), false otherwise
 */
async function validateItemAdded(page: Page): Promise<boolean> {
    console.log(`${await currentTime()} - [cart] Validating item was added to cart...`);
    
    const maxAttempts = 3;
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
        console.log(`${await currentTime()} - [dialog] Attempt ${attempt}/${maxAttempts}: Looking for 'Added to cart' dialog...`);
        
        try {
            // Wait for any dialog to appear
            const dialogLocators = CartLocators.addedToCartDialog();
            const dialog = await getElement(page, dialogLocators, { timeout: 7000 }).catch(() => null);

            if (!dialog) {
                console.warn(`${await currentTime()} - [dialog] ❌ No dialog appeared within timeout (attempt ${attempt})`);
                if (attempt === maxAttempts) return false;
                attempt++;
                continue;
            }

            console.log(`${await currentTime()} - [dialog] ✅ Dialog detected (attempt ${attempt})`);

            // Verify this is the correct "Added to cart" dialog by checking header
            console.log(`${await currentTime()} - [dialog] Verifying dialog header text...`);
            const headerLocators = CartLocators.addedToCartHeader();
            
            // Give more time for header to appear and be more tolerant
            await page.waitForTimeout(1000); // Wait for dialog to fully load
            const header = await getElement(page, headerLocators, { timeout: 5000 }).catch(() => null);

            if (!header) {
                console.warn(`${await currentTime()} - [dialog] ❌ Header not found - might be wrong dialog or timing issue`);
                
                // Check if this was actually a successful add to cart by checking button state
                console.log(`${await currentTime()} - [dialog] Checking if item was actually added by examining button state...`);
                const wasItemAdded = await checkIfItemWasAddedToCart(page);
                
                if (wasItemAdded) {
                    console.log(`${await currentTime()} - [dialog] ✅ Item was actually added! Dialog header check failed due to timing, but button changed to 'See in cart'`);
                    // Close the dialog and return success
                    try {
                        await closeAnyDialog(page);
                        console.log(`${await currentTime()} - [dialog] ✅ Dialog closed after successful add to cart`);
                    } catch (closeError) {
                        console.warn(`${await currentTime()} - [dialog] Could not close dialog but item was added successfully`);
                    }
                    return true;
                }
                
                console.log(`${await currentTime()} - [dialog] Closing wrong dialog and retrying...`);
                // Close the wrong dialog
                try {
                    await closeAnyDialog(page);
                    console.log(`${await currentTime()} - [dialog] ✅ Wrong dialog closed successfully`);
                } catch (closeError) {
                    console.warn(`${await currentTime()} - [dialog] ⚠️ Could not close wrong dialog: ${closeError instanceof Error ? closeError.message : 'Unknown error'}`);
                }
                
                // Wait a bit before retrying
                await page.waitForTimeout(1000);
                attempt++;
                continue;
            }

            // Correct dialog found - verify it's fully visible
            await header.waitFor({ state: 'visible', timeout: 3000 });
            console.log(`${await currentTime()} - [dialog] ✅ Confirmed: Correct 'Added to cart' dialog found!`);

            // Close the correct dialog
            console.log(`${await currentTime()} - [dialog] Closing 'Added to cart' dialog...`);
            await closeDialog(page);
            console.log(`${await currentTime()} - [dialog] ✅ Dialog closed successfully`);
            
            return true;

        } catch (error) {
            console.error(`${await currentTime()} - [dialog] Error during validation attempt ${attempt}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            if (attempt === maxAttempts) return false;
            attempt++;
        }
    }
    
    return false;
}

/**
 * Check if item was actually added to cart by examining button states
 * After successful add to cart, the "Add to cart" button changes to "See in cart"
 * @param page - Playwright page object
 * @returns true if item was added (button changed), false otherwise
 */
async function checkIfItemWasAddedToCart(page: Page): Promise<boolean> {
    console.log(`${await currentTime()} - [validation] Checking button state to confirm item was added...`);
    
    try {
        // First check if "See in cart" button exists (indicates successful add)
        const seeInCartLocators = ProductLocators.seeInCartButton();
        const seeInCartButton = await getElement(page, seeInCartLocators, { timeout: 2000 }).catch(() => null);
        
        if (seeInCartButton) {
            console.log(`${await currentTime()} - [validation] ✅ "See in cart" button found - item was successfully added!`);
            return true;
        }
        
        // If not, check if "Add to cart" button still exists (indicates add failed)
        const addToCartLocators = ProductLocators.addToCartButton();
        const addToCartButton = await getElement(page, addToCartLocators, { timeout: 2000 }).catch(() => null);
        
        if (addToCartButton) {
            console.log(`${await currentTime()} - [validation] ❌ "Add to cart" button still present - item was not added`);
            return false;
        }
        
        // If neither button is found, something unexpected happened
        console.warn(`${await currentTime()} - [validation] ⚠️ Neither 'Add to cart' nor 'See in cart' button found - unclear state`);
        return false;
        
    } catch (error) {
        console.error(`${await currentTime()} - [validation] Error checking button state: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return false;
    }
}

/**
 * Close any dialog that's currently open (for closing wrong/unexpected dialogs)
 * @param page - Playwright page object
 */
async function closeAnyDialog(page: Page): Promise<void> {
    console.log(`${await currentTime()} - [dialog] Attempting to close any open dialog...`);
    
    // Try common dialog close button patterns
    const commonCloseSelectors = [
        'button[aria-label*="Close"]',
        'button[data-testid*="close"]', 
        'button.close',
        '.dialog-close',
        '[role="dialog"] button[type="button"]',
        '.lightbox-dialog__close',
        'button[title*="Close"]'
    ];
    
    for (const selector of commonCloseSelectors) {
        try {
            const closeButton = page.locator(selector).first();
            await closeButton.waitFor({ timeout: 1000 });
            
            if (await closeButton.isVisible()) {
                await closeButton.click();
                console.log(`${await currentTime()} - [dialog] Closed dialog using selector: ${selector}`);
                await page.waitForTimeout(500); // Wait for dialog to close
                return;
            }
        } catch (error) {
            // Continue to next selector if this one fails
        }
    }
    
    // If no specific close button found, try ESC key
    try {
        console.log(`${await currentTime()} - [dialog] No close button found, trying ESC key...`);
        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
    } catch (error) {
        console.warn(`${await currentTime()} - [dialog] Could not close dialog with ESC key`);
    }
}

/**
 * Attempt to close the "Added to cart" dialog
 * @param page - Playwright page object
 */
async function closeDialog(page: Page): Promise<void> {
    console.log(`${await currentTime()} - [dialog] Starting dialog close process...`);

    // 1. Detect dialog
    const dialogLocators = CartLocators.addedToCartDialog();
    const dialog = await getElement(page, dialogLocators, { timeout: 3000 });
    if (!dialog) {
        console.log(`${await currentTime()} - [dialog] No dialog found, nothing to close.`);
        return;
    }
    console.log(`${await currentTime()} - [dialog] Dialog detected.`);

    // 2. Wait till it finishes loading (wait for dialog to be stable)
    await page.waitForTimeout(2000);
    console.log(`${await currentTime()} - [dialog] Dialog loading wait completed.`);

    // 3. Find the specific close button within the "Added to cart" dialog
    // First find the specific dialog that contains "Added to cart" header
    const headerLocators = CartLocators.addedToCartHeader();
    const header = await getElement(page, headerLocators, { timeout: 3000 });
    if (!header) {
        throw new Error('Added to cart header not found in dialog');
    }
    
    // Find the dialog window that contains this header using centralized locator
    const dialogParentLocators = CartLocators.dialogParentFromHeader();
    const dialogWindow = header.locator(dialogParentLocators[0].value).first();
    await dialogWindow.waitFor({ state: 'attached', timeout: 3000 });
    
    // Now find the close button within THIS specific dialog window using centralized locator
    const closeButtonWithinDialogLocators = CartLocators.closeButtonWithinDialog();
    const closeButton = dialogWindow.locator(closeButtonWithinDialogLocators[0].value).first();
    await closeButton.waitFor({ state: 'attached', timeout: 3000 });
    
    console.log(`${await currentTime()} - [dialog] Close button found within the specific 'Added to cart' dialog.`);

    // 4. Close using JavaScript evaluation (works for hidden elements)
    await closeButton.evaluate((button: HTMLElement) => button.click());
    console.log(`${await currentTime()} - [dialog] Close button clicked using JavaScript.`);

    // 5. Validate that dialog is no longer visible
    await page.waitForTimeout(1000); // Wait for close animation
    
    // Try to find the dialog again - if we can find it and it's visible, close failed
    const dialogStillExists = await getElement(page, dialogLocators, { timeout: 2000 })
        .catch(() => null);
    
    if (dialogStillExists) {
        const isStillVisible = await dialogStillExists.isVisible().catch(() => false);
        if (isStillVisible) {
            throw new Error('Dialog is still visible after close attempt');
        }
    }
    
    console.log(`${await currentTime()} - [dialog] Dialog confirmed closed.`);
}
