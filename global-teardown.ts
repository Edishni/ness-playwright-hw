import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
    console.log('🏁 Starting global teardown...');
    
    // Generate test run summary
    const testResultsDir = 'test-results';
    if (fs.existsSync(testResultsDir)) {
        const files = fs.readdirSync(testResultsDir, { recursive: true });
        const screenshots = files.filter(f => typeof f === 'string' && f.endsWith('.png')).length;
        const videos = files.filter(f => typeof f === 'string' && f.endsWith('.webm')).length;
        
        console.log('Test Run Summary:');
        console.log(`   Screenshots: ${screenshots}`);
        console.log(`   Videos: ${videos}`);
    }
    
    // Create categories.json for Allure if it doesn't exist
    const categoriesPath = path.join('allure-results', 'categories.json');
    if (!fs.existsSync(categoriesPath)) {
        const categories = [
            {
                "name": "Cart Issues",
                "matchedStatuses": ["failed"],
                "messageRegex": ".*cart.*"
            },
            {
                "name": "Search Problems",
                "matchedStatuses": ["failed"],
                "messageRegex": ".*search.*"
            },
            {
                "name": "Product Issues",
                "matchedStatuses": ["failed"],
                "messageRegex": ".*product.*"
            },
            {
                "name": "Navigation Problems",
                "matchedStatuses": ["failed"],
                "messageRegex": ".*nav.*|.*goto.*|.*page.*"
            },
            {
                "name": "Locator Failures",
                "matchedStatuses": ["failed"],
                "messageRegex": ".*locator.*|.*selector.*|.*element.*"
            }
        ];
        
        fs.writeFileSync(categoriesPath, JSON.stringify(categories, null, 2));
        console.log(' Created categories.json for Allure');
    }
    
    console.log('✅ Global teardown completed');
    console.log('To view Allure report: npm run allure:serve');
}

export default globalTeardown;