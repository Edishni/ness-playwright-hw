import { Page } from '@playwright/test';
import { currentTime } from './time-utility';

export interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    retryCondition?: (error: Error) => boolean;
}

/**
 * Retry mechanism following Playwright best practices
 * Implements exponential backoff with jitter for network reliability
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 10000,
        backoffMultiplier = 2,
        retryCondition = (error) => {
            // Retry on timeout errors and network issues
            return error.message.includes('Timeout') || 
                   error.message.includes('net::') ||
                   error.message.includes('Navigation') ||
                   error.message.includes('waitForLoadState');
        }
    } = options;

    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = Math.min(
                    baseDelay * Math.pow(backoffMultiplier, attempt - 1),
                    maxDelay
                );
                // Add jitter (±25%) to prevent thundering herd
                const jitteredDelay = delay + (Math.random() - 0.5) * delay * 0.5;
                
                console.log(`${await currentTime()} - [retry] Attempt ${attempt}/${maxRetries} after ${Math.round(jitteredDelay)}ms delay...`);
                await new Promise(resolve => setTimeout(resolve, jitteredDelay));
            }

            const result = await operation();
            
            if (attempt > 0) {
                console.log(`${await currentTime()} - [retry] ✅ Operation succeeded on attempt ${attempt + 1}/${maxRetries + 1}`);
            }
            
            return result;
            
        } catch (error) {
            lastError = error as Error;
            
            if (attempt === maxRetries) {
                console.error(`${await currentTime()} - [retry] ❌ All ${maxRetries + 1} attempts failed. Final error: ${lastError.message}`);
                throw lastError;
            }
            
            if (!retryCondition(lastError)) {
                console.error(`${await currentTime()} - [retry] ❌ Non-retryable error: ${lastError.message}`);
                throw lastError;
            }
            
            console.warn(`${await currentTime()} - [retry] ⚠️ Attempt ${attempt + 1} failed: ${lastError.message}`);
        }
    }

    throw lastError!;
}

/**
 * Retry wrapper specifically for page navigation and load operations
 */
export async function withPageRetry<T>(
    page: Page,
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    return withRetry(operation, {
        maxRetries: 2,
        baseDelay: 2000,
        retryCondition: (error) => {
            // Retry on common page loading issues
            return error.message.includes('Timeout') || 
                   error.message.includes('waitForLoadState') ||
                   error.message.includes('Navigation') ||
                   error.message.includes('net::ERR_');
        },
        ...options
    });
}

/**
 * Retry wrapper for locator operations with element-specific conditions
 */
export async function withLocatorRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    return withRetry(operation, {
        maxRetries: 3,
        baseDelay: 1000,
        retryCondition: (error) => {
            // Retry on locator and element interaction issues
            return error.message.includes('Timeout') || 
                   error.message.includes('locator') ||
                   error.message.includes('element') ||
                   error.message.includes('selector');
        },
        ...options
    });
}