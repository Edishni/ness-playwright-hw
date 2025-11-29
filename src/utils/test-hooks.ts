import { TestInfo, Page } from '@playwright/test';
import { allure } from 'allure-playwright';
import { currentTime } from './time-utility';

/**
 * Enhanced test hooks for better screenshot and report management
 */
export class TestHooks {
  
  /**
   * Take screenshot with proper Allure integration and organized file structure
   */
  static async takeScreenshot(
    page: Page, 
    testInfo: TestInfo, 
    name: string, 
    description?: string
  ): Promise<void> {
    try {
      console.log(`${await currentTime()} - [test-hooks] 📸 Taking screenshot: ${name}`);
      
      const screenshot = await page.screenshot({ 
        fullPage: true,
        type: 'png'
      });
      
      // Attach to test info (for HTML report)
      testInfo.attach(name, {
        body: screenshot,
        contentType: 'image/png'
      });
      
      // Attach to Allure (for Allure report)
      try {
        await allure.attachment(
          description || name, 
          screenshot, 
          'image/png'
        );
        console.log(`${await currentTime()} - [test-hooks] ✅ Screenshot attached to Allure: ${name}`);
      } catch (allureError) {
        console.warn(`${await currentTime()} - [test-hooks] ⚠️ Failed to attach to Allure: ${allureError}`);
      }
      
    } catch (error) {
      console.error(`${await currentTime()} - [test-hooks] ❌ Failed to take screenshot: ${error}`);
    }
  }
  
  /**
   * Enhanced test step annotation for better Allure reporting
   */
  static async step<T>(name: string, body: () => Promise<T>): Promise<T> {
    console.log(`${await currentTime()} - [test-step] 🔄 Starting: ${name}`);
    
    return await allure.step(name, async () => {
      try {
        const result = await body();
        console.log(`${await currentTime()} - [test-step] ✅ Completed: ${name}`);
        return result;
      } catch (error) {
        console.error(`${await currentTime()} - [test-step] ❌ Failed: ${name} - ${error}`);
        throw error;
      }
    });
  }
  
  /**
   * Attach test data to reports with consistent formatting
   */
  static async attachData(
    testInfo: TestInfo, 
    name: string, 
    data: any, 
    type: 'json' | 'text' = 'json'
  ): Promise<void> {
    try {
      const content = type === 'json' ? JSON.stringify(data, null, 2) : String(data);
      const contentType = type === 'json' ? 'application/json' : 'text/plain';
      
      // Attach to test info
      testInfo.attach(name, {
        body: content,
        contentType
      });
      
      // Attach to Allure
      try {
        await allure.attachment(name, content, contentType);
        console.log(`${await currentTime()} - [test-hooks] ✅ Data attached: ${name}`);
      } catch (allureError) {
        console.warn(`${await currentTime()} - [test-hooks] ⚠️ Failed to attach data to Allure: ${allureError}`);
      }
      
    } catch (error) {
      console.error(`${await currentTime()} - [test-hooks] ❌ Failed to attach data: ${error}`);
    }
  }
  
  /**
   * Test setup with enhanced reporting
   */
  static async beforeEach(testInfo: TestInfo, page: Page): Promise<void> {
    console.log(`${await currentTime()} - [test-hooks] 🚀 Test starting: ${testInfo.title}`);
    
    // Add test info to Allure
    await allure.epic('E-Commerce Testing');
    await allure.feature(testInfo.titlePath[0] || 'Core Requirements');
    await allure.story(testInfo.title);
    await allure.description(`Test: ${testInfo.title}\nProject: ${testInfo.project.name}`);
  }
  
  /**
   * Test teardown with failure screenshot
   */
  static async afterEach(testInfo: TestInfo, page: Page): Promise<void> {
    if (testInfo.status === 'failed') {
      console.log(`${await currentTime()} - [test-hooks] 📸 Test failed - taking failure screenshot`);
      await TestHooks.takeScreenshot(
        page, 
        testInfo, 
        'test-failure-screenshot',
        `Failure screenshot for: ${testInfo.title}`
      );
    }
    
    console.log(`${await currentTime()} - [test-hooks] 🏁 Test finished: ${testInfo.title} (${testInfo.status})`);
  }
}