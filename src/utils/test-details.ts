import fs from 'fs';
import path from 'path';

export function loadTestData(): any {
    const p = path.resolve(process.cwd(), 'data/test-data.json');
    return JSON.parse(fs.readFileSync(p, 'utf8'));
}

/**
 * Load test data from external JSON files based on the test suite name
 * @param suiteName - Name of the test suite (e.g., 'ebay', 'advanced-search', 'search')
 * @returns Parsed test data from the corresponding JSON file
 */
export function loadTestDataForSuite(suiteName: string): any {
    const fileName = `${suiteName}-test-data.json`;
    const filePath = path.resolve(process.cwd(), `data/${fileName}`);

    if (!fs.existsSync(filePath)) {
        throw new Error(`Test data file not found: ${filePath}`);
    }

    const testData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    // Validate array lengths to prevent runtime errors
    console.log(`${suiteName} test data loaded:`);
    if (testData.searchScenarios) {
        console.log(`  - searchScenarios: ${testData.searchScenarios.length} items (indexes 0-${testData.searchScenarios.length - 1})`);
    }
    if (testData.cartTests) {
        console.log(`  - cartTests: ${testData.cartTests.length} items (indexes 0-${testData.cartTests.length - 1})`);
    }
    if (testData.budgetTests) {
        console.log(`  - budgetTests: ${testData.budgetTests.length} items (indexes 0-${testData.budgetTests.length - 1})`);
    }
    
    return testData;
}