# eBay E-commerce Test Automation Framework

A robust, enterprise-grade test automation framework built with Playwright and TypeScript for eBay e-commerce workflows. Features smart locator strategies, parallel execution, and comprehensive cart workflow testing.

---

## 🚀 Key Features

- **Smart Locator Strategy:** Multi-fallback locators (CSS/XPath/Text) with automatic retries and screenshot on failure.
- **Page Object Model (POM):** All business logic in dedicated page classes (`EbayHomePage`, `EbayProductPage`, `CartPage`).
- **Data-Driven:** Test scenarios and parameters loaded from external JSON files.
- **Parallel Execution:** Native Playwright parallelism; session isolation per test.
- **Comprehensive Reporting:** Allure integration, HTML reports, screenshots on failure.
- **Resilience:** Robust error handling, retry/backoff, and graceful recovery.

---

## 🏗️ Project Structure

```
ness-playwright-hw/
├── data/
│   ├── locators.json
│   └── core-requirements-test-data.json
├── src/
│   ├── pages/
│   │   ├── ebay-home-page.ts
│   │   ├── ebay-product-page.ts
│   │   ├── ebay-cart-page.ts
│   │   └── ebay-login-page.ts
│   ├── utils/
│   │   ├── locator-utility.ts
│   │   ├── locators-loader.ts
│   │   ├── time-utility.ts
│   │   ├── screenshot-manager.ts
│   │   └── test-hooks.ts
│   └── tests/
│       ├── eBay-human-workflow.spec.ts
│       ├── eBay-workflows.spec.ts
│       └── eBay-single-item.spec.ts
├── test-results/
├── playwright.config.ts
└── package.json
```

---

## 📋 Core Functions

### 1. Product Search with Price Filtering

```typescript
const urls = await homePage.searchItemsByNameUnderPrice(page, "shoes", 220, 5);
```
- Performs search, applies price filter, paginates, and collects item URLs.

### 2. Add Items to Cart

```typescript
await productPage.addItemsToCart(page, urls, testInfo);
```
- Opens each product, selects random variants, adds to cart, and logs/saves screenshots.

### 3. Cart Total Verification

```typescript
await cartPage.validateCartTotalNotExceeds(budgetPerItem, itemCount, testInfo);
```
- Opens cart, checks subtotal, asserts budget, and attaches screenshot.

---

## 🏃 Quick Start

### Prerequisites

- Node.js 18+
- npm

### Installation

```powershell
git clone https://github.com/Edishni/ness-playwright-hw.git
cd ness-playwright-hw
npm install
npx playwright install
```

### Running Tests

```powershell
# Run specific test - automate adding items
npx playwright test "eBay-workflows.spec.ts"

# Run specific test - humanlike workflow
npx playwright test "eBay-human-workflow.spec.ts"

npx playwright test                      # Run all tests
npx playwright test --project=chromium   # Run with specific browser
npx playwright test --headed             # Run in headed mode
npx playwright test --debug              # Debug mode
```

### Viewing Reports

```powershell
npx playwright show-report               # Open HTML report
npm run allure:generate                  # Generate Allure report
npm run allure:open                      # Open Allure report
```

## 🔧 Configuration

- **Browser Matrix:** 
Set in `playwright.config.ts` for Chrome, Firefox, WebKit, etc. 
Playwright parallelism is used; 
Selenium Grid/Moon is not implemented, but can be enabled via the `PLAYWRIGHT_WS` environment variable in CI (`playwright-ci.yml`).
- **Locators:** 
Managed in `data/locators.json` and loaded via `locators-loader.ts`.
- **Test Data:** 
Scenarios in `data/core-requirements-test-data.json`.

---

## 🧪 Data-Driven Testing

- All test scenarios, search queries, and price limits are defined in JSON files.
- Easily extendable for new categories, price ranges, or cart scenarios.

---
## 📊 CI/CD Pipeline

### GitHub Actions Features
- **Multi-browser testing**: Parallel execution across Chrome, Firefox, WebKit
- **Artifact preservation**: Test reports and screenshots saved for 30 days
- **Smart reporting**: Combined test results with summary generation
- **Failure handling**: Continues testing even if one browser fails
- **Manual triggers**: Workflow dispatch for on-demand testing

### Pipeline Triggers
- `push` to main/develop branches
- `pull_request` to main branch  
- `workflow_dispatch` for manual runs

---

## 📈 Reporting


### Automated Reports
- **HTML Report**: Interactive test results with screenshots
- **Trace Viewer**: Step-by-step execution replay
- **CI Artifacts**: Download test results and screenshots
- **GitHub Summary**: Auto-generated test status overview


### CI Debugging
- Download artifacts from GitHub Actions
- Review test-results folder for screenshots
- Check workflow logs for detailed execution traces

---
## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/Edishni/ness-playwright-hw/issues)
- **Documentation**: [Project Wiki](https://github.com/Edishni/ness-playwright-hw/wiki)
- **CI Status**: [GitHub Actions](https://github.com/Edishni/ness-playwright-hw/actions)

---

## 📝 Limitations & Known Issues

- **Login:** Tests use guest checkout; automated login may be blocked by eBay anti-bot/CAPTCHA. A login POM exists but is not functional and not covered by tests.
- **eBay Site Issues:**
  - Frequent pop-up dialogs (advisors, surveys, etc.) may interfere with automation.
  - Many items are in "bid" status and cannot be added to cart.
  - Anti-bot mechanisms may block or slow down automation.
  - Mixed currencies can appear on the same page, requiring robust price parsing.
- **Browser Matrix:** Playwright parallelism is used; Selenium Grid/Moon is not implemented but can be enabled via CI environment variables.
- **Test Data:** All scenarios are data-driven; add new cases via JSON.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit and push your changes
4. Open a Pull Request

---

## 📄 License

MIT License. See [LICENSE](LICENSE) for details.

---

**Built with Playwright, TypeScript, and GitHub Actions**

---

For any questions or issues, please use [GitHub Issues](https://github.com/Edishni/ness-playwright-hw/issues).
