import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: 'src/tests',
    testMatch: '**/*.spec.ts', // Let CLI specify which tests to run
    testIgnore: process.env.CI ? ['**/temp-tests/**'] : ['**/temp-tests/**'], // Allow core tests in CI
    timeout: process.env.CI ? 5 * 60 * 1000 : 10 * 60 * 1000, // 5 min in CI, 10 min local
    expect: { timeout: process.env.CI ? 15000 : 5000 }, // Longer waits in CI
    reporter: process.env.CI ? [['github'], ['html']] : [['list'], ['html']],
    outputDir: 'test-results',
    fullyParallel: false, // Disable parallel for CI stability
    use: {
        headless: true,
        viewport: { width: 1280, height: 720 }, // Fixed viewport for CI
        ignoreHTTPSErrors: true,
        screenshot: 'only-on-failure',
        video: process.env.CI ? 'retain-on-failure' : 'off',
        // CI-specific settings
        actionTimeout: process.env.CI ? 30000 : 0,
        navigationTimeout: process.env.CI ? 60000 : 30000, // Longer navigation timeout
    },
    workers: process.env.CI ? 1 : 3,
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },

    ]
});
