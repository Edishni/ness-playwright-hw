import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
    testDir: 'src/tests',
    testMatch: '**/*.spec.ts', // Let CLI specify which tests to run
    testIgnore: process.env.CI ? ['**/temp-tests/**'] : ['**/temp-tests/**'], // Allow core tests in CI
    timeout: process.env.CI ? 10 * 60 * 1000 : 15 * 60 * 1000, // 10 min in CI, 15 min local
    expect: { timeout: process.env.CI ? 15000 : 5000 }, // Longer waits in CI
    retries: process.env.CI ? 1 : 0,  // 2 retries in CI, none locally

    // Global setup and teardown
    globalSetup: path.resolve(__dirname, 'global-setup.ts'),
    globalTeardown: path.resolve(__dirname, 'global-teardown.ts'),

    reporter: process.env.CI
        ? [
            ['github'],
            ['html'],
            ['allure-playwright', {
                outputFolder: 'allure-results',
                suiteTitle: false,
                detail: true,
                attachments: {
                    screenshot: 'always',
                    video: 'retain-on-failure',
                    trace: 'retain-on-failure'
                }
            }]
        ]
        : [
            ['list'],
            ['html', { outputFolder: 'playwright-report', open: 'always' }],
            ['junit', { outputFile: 'test-results/results.xml' }],
            ['allure-playwright', {
                outputFolder: 'allure-results',
                suiteTitle: true,
                detail: true,
                attachments: {
                    screenshot: 'always',
                    video: 'retain-on-failure',
                    trace: 'retain-on-failure'
                }
            }]],
    outputDir: 'test-results',
    fullyParallel: true, // Enable parallel for CI stability
    // If has Moon or Grid integration, use their WS endpoint
    use: process.env.PLAYWRIGHT_WS
        ?
        {
            connectOptions: { wsEndpoint: process.env.PLAYWRIGHT_WS },
        }
        :
        {
            headless: true, // help to decrese anti-bot detection
            viewport: { width: 1280, height: 720 },
            ignoreHTTPSErrors: true,
            screenshot: {
                mode: 'only-on-failure', // Keep default for automatic screenshots
                fullPage: true
            },
            video: {
                mode: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
                size: { width: 1280, height: 720 }
            },
            trace: process.env.CI ? 'retain-on-failure' : 'retain-on-failure',
            actionTimeout: process.env.CI ? 30000 : 0,
            navigationTimeout: process.env.CI ? 60000 : 30000,
        },
    workers: process.env.CI ? 2 : 3,
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    ]
});
