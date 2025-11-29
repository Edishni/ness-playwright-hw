import { Page, TestInfo } from '@playwright/test';
import { allure } from 'allure-playwright';
import * as fs from 'fs';
import * as path from 'path';
import { currentTime } from './time-utility';

export interface ScreenshotOptions {
    name?: string;
    fullPage?: boolean;
    clip?: { x: number; y: number; width: number; height: number };
    quality?: number;
    type?: 'png' | 'jpeg';
    attachToAllure?: boolean;
    saveToTestResults?: boolean;
}

/**
 * Screenshot manager following POM and OOP best practices
 * Handles organized screenshot storage and Allure integration
 */
export class ScreenshotManager {
    private readonly page: Page;
    private readonly testInfo: TestInfo;
    private readonly screenshotDir: string;

    constructor(page: Page, testInfo: TestInfo) {
        this.page = page;
        this.testInfo = testInfo;
        this.screenshotDir = this.createScreenshotDirectory();
    }

    /**
     * Creates organized directory structure for screenshots
     * Addresses issue #1: Better organization than flat test-results directory
     */
    private createScreenshotDirectory(): string {
        const testName = this.testInfo.title.replace(/[^a-zA-Z0-9]/g, '-');
        const browserName = this.testInfo.project.name || 'unknown';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        
        // Create organized directory structure: test-results/screenshots/TestName-Browser-Timestamp
        const dirName = `${testName}-${browserName}-${timestamp}`;
        const fullPath = path.join('test-results', 'screenshots', dirName);
        
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
        
        return fullPath;
    }

    /**
     * Take a screenshot with enhanced naming and organization
     * Follows Playwright best practices for screenshot management
     */
    async takeScreenshot(options: ScreenshotOptions = {}): Promise<string> {
        const {
            name = `screenshot-${Date.now()}`,
            fullPage = true,
            clip,
            quality = 90,
            type = 'png',
            attachToAllure = true,
            saveToTestResults = true
        } = options;

        try {
            const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, '-');
            const timestamp = await currentTime();
            const filename = `${sanitizedName}-${timestamp.replace(/[:.\s]/g, '-')}.${type}`;
            
            const screenshotBuffer = await this.page.screenshot({
                path: saveToTestResults ? path.join(this.screenshotDir, filename) : undefined,
                fullPage,
                clip,
                quality: type === 'jpeg' ? quality : undefined,
                type
            });

            if (attachToAllure) {
                await allure.attachment(name, screenshotBuffer, `image/${type}`);
                console.log(`${timestamp} - [screenshot] 📸 Attached to Allure: ${name}`);
            }

            if (saveToTestResults) {
                const savedPath = path.join(this.screenshotDir, filename);
                console.log(`${timestamp} - [screenshot] 💾 Saved: ${savedPath}`);
                return savedPath;
            }

            return 'screenshot-buffer-only';
        } catch (error) {
            const timestamp = await currentTime();
            console.error(`${timestamp} - [screenshot] ❌ Failed: ${error}`);
            throw error;
        }
    }

    /**
     * Take a cart page screenshot (addresses requirement #2)
     * Specialized method for cart page screenshots with proper naming
     */
    async takeCartScreenshot(): Promise<string> {
        const timestamp = await currentTime();
        console.log(`${timestamp} - [screenshot] 🛒 Taking cart page screenshot...`);
        
        return await this.takeScreenshot({
            name: 'cart-page-validation',
            fullPage: true,
            attachToAllure: true,
            saveToTestResults: true
        });
    }

    /**
     * Take a screenshot on test failure with enhanced context
     * Improved naming to avoid generic locator-failure names
     */
    async takeFailureScreenshot(errorMessage?: string): Promise<string> {
        const timestamp = await currentTime();
        const name = `failure-${errorMessage ? errorMessage.slice(0, 30).replace(/[^a-zA-Z0-9]/g, '-') : 'unknown'}`;
        
        console.log(`${timestamp} - [screenshot] ❌ Taking failure screenshot: ${name}`);
        
        return await this.takeScreenshot({
            name,
            fullPage: true,
            attachToAllure: true,
            saveToTestResults: true
        });
    }

    /**
     * Take a step screenshot for Allure integration
     * Used by AllureLogger for step-by-step documentation
     */
    async takeStepScreenshot(stepName: string): Promise<string> {
        const timestamp = await currentTime();
        const sanitizedStepName = stepName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
        const name = `step-${sanitizedStepName}`;
        
        console.log(`${timestamp} - [screenshot] 📋 Taking step screenshot: ${stepName}`);
        
        return await this.takeScreenshot({
            name,
            fullPage: true,
            attachToAllure: true,
            saveToTestResults: true
        });
    }

    /**
     * Get the screenshot directory for external access
     */
    getScreenshotDirectory(): string {
        return this.screenshotDir;
    }

    /**
     * Static method to clean old screenshots
     * Prevents disk space issues from accumulating screenshots
     */
    static cleanOldScreenshots(daysOld = 7): void {
        const screenshotsDir = path.join('test-results', 'screenshots');
        if (!fs.existsSync(screenshotsDir)) return;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        const directories = fs.readdirSync(screenshotsDir);
        let cleanedCount = 0;

        directories.forEach(dir => {
            const dirPath = path.join(screenshotsDir, dir);
            try {
                const stats = fs.statSync(dirPath);
                
                if (stats.isDirectory() && stats.mtime < cutoffDate) {
                    fs.rmSync(dirPath, { recursive: true, force: true });
                    cleanedCount++;
                }
            } catch (error) {
                // Ignore errors for individual directories
            }
        });

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} old screenshot directories`);
        }
    }
}