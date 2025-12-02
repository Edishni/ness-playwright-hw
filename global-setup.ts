import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { ScreenshotManager } from './src/utils/screenshot-manager';

async function globalSetup(config: FullConfig) {
    console.log('Starting global setup...');
    
    // Create necessary directories
    const directories = [
        'test-results',
        'test-results/screenshots', 
        'test-results/videos',
        'allure-results'
    ];
    
    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Created directory: ${dir}`);
        }
    });
    
    // Set environment info for Allure
    const envInfo = {
        NODE_VERSION: process.version,
        OS: process.platform,
        TIMESTAMP: new Date().toISOString(),
        TEST_ENV: process.env.NODE_ENV || 'development',
        CI: process.env.CI || 'false'
    };
    
    // Write environment info for Allure
    const envPath = path.join('allure-results', 'environment.properties');
    const envContent = Object.entries(envInfo)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
        
    fs.writeFileSync(envPath, envContent);
    console.log('Created environment.properties for Allure');
    
    console.log('Global setup completed');
}

export default globalSetup;