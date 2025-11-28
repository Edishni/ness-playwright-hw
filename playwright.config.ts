import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'src/tests',
    testMatch: '**/*.spec.ts',
    testIgnore: '**/temp-tests/**',
    timeout: 10 * 60 * 1000
    ,
    expect: { timeout: 5000 },
    reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
    outputDir: 'test-results',
    fullyParallel: true,
    use: {
        headless: true,
        viewport: null, // Use full browser window size
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure'
    },
    workers: process.env.CI ? 1 : 3,
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    ]
});
