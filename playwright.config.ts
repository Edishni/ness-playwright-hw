import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'src/tests',
    testMatch: '**/*.spec.ts',
    testIgnore: '**/temp-tests/**',
    timeout: 10 * 60 * 1000
    ,
    expect: { timeout: 5000 },
    reporter: [['list'], ['allure-playwright']],
    outputDir: 'test-results',
    fullyParallel: true,
    use: {
        headless: true,
        viewport: null, // Use full browser window size
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    workers: process.env.CI ? '100%' : 3,
    projects: [
        { name: 'chromium-125', use: { ...devices['Desktop Chromium 125'] } },
        { name: 'chrome-142', use: { ...devices['Desktop Chrome 142'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'edge', use: { ...devices['Desktop Edge'] } },

    ]
});
