import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'src/tests',
    testMatch: '**/*.spec.ts',
    testIgnore: '**/temp-tests/**',
    timeout: process.env.CI ? 15 * 60 * 1000 : 10 * 60 * 1000, // 15 min in CI, 10 min local
    expect: { timeout: process.env.CI ? 10000 : 5000 }, // Longer waits in CI
    reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
    outputDir: 'test-results',
    fullyParallel: true,
    use: {
        headless: true,
        viewport: null, // Use full browser window size
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        // CI-specific settings
        actionTimeout: process.env.CI ? 30000 : 0,
        navigationTimeout: process.env.CI ? 30000 : 30000,
    },
    workers: process.env.CI ? 1 : 3,
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    ]
});
