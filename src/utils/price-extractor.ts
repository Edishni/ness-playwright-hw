/**
 * eBay Price Extraction Utility
 * 
 * Handles extraction and parsing of prices from eBay search results.
 * Supports both single prices (e.g., "ILS 281.32") and price ranges (e.g., "ILS 65.26 to ILS 98.05")
 */

import { Locator } from '@playwright/test';

export interface ExtractedPrice {
  minPrice: number;
  maxPrice: number;
  currency: string;
  isRange: boolean;
  rawText: string;
}

/**
 * Extract price information from eBay price text
 * 
 * Handles formats:
 * - Single: "ILS 281.32"
 * - Range: "ILS 65.26 to ILS 98.05"
 * 
 * @param priceText - Raw text from price element
 * @returns Extracted price information or null if parsing fails
 */
export function extractPrice(priceText: string): ExtractedPrice | null {
  if (!priceText || typeof priceText !== 'string') {
    return null;
  }

  // Trim and normalize whitespace
  const normalized = priceText.trim().replace(/\s+/g, ' ');

  // Extract currency code (first 3 letters typically)
  const currencyMatch = normalized.match(/^([A-Z]{3})\s/);
  const currency = currencyMatch ? currencyMatch[1] : 'USD';

  // Extract all numbers from text
  const numbers = normalized.match(/\d+\.?\d*/g) || [];

  if (numbers.length === 0) {
    console.warn(`Could not extract prices from text: "${normalized}"`);
    return null;
  }

  if (numbers.length === 1) {
    // Single price
    const price = parseFloat(numbers[0]);
    if (isNaN(price)) {
      return null;
    }
    return {
      minPrice: price,
      maxPrice: price,
      currency,
      isRange: false,
      rawText: normalized
    };
  } else {
    // Range price (e.g., "ILS 65.26 to ILS 98.05" gives [65.26, 98.05])
    const minPrice = parseFloat(numbers[0] || '0');
    const maxPrice = parseFloat(numbers[1] || '0');
    
    if (isNaN(minPrice) || isNaN(maxPrice)) {
      return null;
    }
    
    return {
      minPrice,
      maxPrice,
      currency,
      isRange: true,
      rawText: normalized
    };
  }
}

/**
 * Check if item price is within budget
 * 
 * For ranges, uses minimum price; for single prices, uses that price
 * 
 * @param priceText - Raw text from price element
 * @param maxBudget - Maximum allowed price
 * @returns true if item is within budget, false otherwise
 */
export function isPriceWithinBudget(priceText: string, maxBudget: number): boolean {
  const extracted = extractPrice(priceText);
  if (!extracted) {
    return false; // If we can't parse, exclude to be safe
  }

  // Use minimum price for comparison (conservative approach for ranges)
  return extracted.minPrice <= maxBudget;
}

