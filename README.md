# eBay E-commerce Test Automation Framework

[![Playwright Tests CI](https://github.com/Edishni/ness-playwright-hw/actions/workflows/playwright-ci.yml/badge.svg)](https://github.com/Edishni/ness-playwright-hw/actions/workflows/playwright-ci.yml)

A robust, enterprise-grade test automation framework built with Playwright and TypeScript for eBay e-commerce testing. Features smart locator strategies, parallel execution, and comprehensive cart workflow testing.

## 🚀 Key Features

### ⭐ Smart & Resilient Locator Strategy
- **Multi-fallback locators**: Every UI element has 2-3 alternative locators (CSS, XPath, Text)
- **Automatic fallback**: Runtime failover when primary locators fail
- **Centralized management**: JSON-based locator configuration with TypeScript loader
- **Smart screenshots**: Automatic failure screenshots with meaningful names
- **Detailed logging**: Complete locator attempt tracking and success/failure reports

### 🔄 Parallel Execution & Browser Matrix
- **Cross-browser testing**: Chrome, Firefox, Edge, WebKit support
- **Version matrix**: Multiple browser versions (Chrome 125/142)
- **Session isolation**: Each test gets independent browser context
- **Configurable workers**: CI-optimized parallel execution
- **Separate reporting**: Per-browser test reports and artifacts

### 🛒 Core E-commerce Functions

#### 1. **Smart Product Search with Price Filtering**
```typescript
const urls = await searchItemsByNameUnderPrice("shoes", 400, 5);
```
- Advanced search with price conditions
- Automatic price filter application
- Multi-page pagination handling
- Currency-independent price parsing
- Robust item collection across search results

#### 2. **Intelligent Cart Management**
```typescript
await addItemsToCart(page, urls, testInfo);
```
- **Random variant selection**: Size, color, style, quantity
- **Multi-language support**: Handles German/English variants
- **Smart dropdown detection**: Finds actively open dropdowns
- **Error resilience**: Continues if variants unavailable
- **Dialog management**: Automatic "Added to cart" dialog handling

#### 3. **Budget Verification**
```typescript
await assertCartTotalNotExceeds(budgetPerItem, itemCount, testInfo);
```
- Automatic cart total extraction
- Budget threshold calculations
- Screenshot capture for verification
- Multi-currency support

## 🏗️ Project Structure

```
ness-playwright-hw/
├── .github/workflows/          # CI/CD pipelines
├── data/                       # Test data and locators
│   ├── locators.json          # Centralized element locators
│   └── core-requirements-test-data.json
├── src/
│   ├── pages/                 # Page Object Models
│   │   ├── ebay-home-page.ts
│   │   ├── ebay-product-page.ts
│   │   └── ebay-cart-page.ts
│   ├── utils/                 # Core utilities
│   │   ├── locator-utility.ts      # Smart locator engine
│   │   ├── locators-loader.ts      # Centralized locator loader
│   │   ├── search-utils.ts         # Search & price filtering
│   │   ├── product-utils.ts        # Cart & variant management
│   │   ├── cart-utils.ts           # Cart verification
│   │   └── ebay-price-extractor.ts # Currency-aware price parsing
│   └── tests/
│       └── core-requirements.spec.ts # Complete test suite
├── test-results/              # Test outputs and screenshots
├── playwright.config.ts       # Playwright configuration
└── package.json
```

## 📋 Test Scenarios

### **CR1: Search Functions** 
- Multi-term search with price limits
- Cross-page item collection
- Price filtering and validation

### **CR2: Cart Operations**
- Single item with variant selection
- Multiple item cart building  
- Maximum capacity testing

### **CR5: Complete Integration Workflows**
- End-to-end search → variant selection → cart → budget verification
- Stress testing with maximum items
- Browser compatibility across scenarios

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
```bash
git clone https://github.com/Edishni/ness-playwright-hw.git
cd ness-playwright-hw
npm install
npx playwright install
```

### Run Tests
```bash
# Run all tests
npm test

# Run specific test
npx playwright test --grep "CR1.1"

# Run with specific browser
npx playwright test --project=chromium

# Run in headed mode
npx playwright test --headed

# Run with debug
npx playwright test --debug
```

### View Reports
```bash
# Open HTML report
npx playwright show-report

# Open trace viewer
npx playwright show-trace test-results/trace.zip
```

## 🔧 Configuration

### Browser Matrix (playwright.config.ts)
```typescript
projects: [
  { name: 'chromium-125', use: { ...devices['Desktop Chromium 125'] } },
  { name: 'chrome-142', use: { ...devices['Desktop Chrome 142'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'edge', use: { ...devices['Desktop Edge'] } }
]
```

### Locator Strategy (data/locators.json)
```json
{
  "searchInput": [
    { "type": "css", "value": "input#gh-ac" },
    { "type": "xpath", "value": "//input[@id='gh-ac']" },
    { "type": "placeholder", "value": "Search for anything" }
  ]
}
```

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

## 🧪 Test Data Management

### Centralized Test Data
```json
{
  "searchScenarios": [
    {
      "query": "shoes",
      "maxPrice": 400,
      "limit": 5,
      "expectedMinResults": 1
    }
  ],
  "cartTests": [
    { "itemsToAdd": 1 },
    { "itemsToAdd": 3 },
    { "itemsToAdd": 5 }
  ]
}
```

## 🎯 Advanced Features

### Smart Variant Selection
- **Dynamic detection**: Finds size/color/style variants automatically
- **Multi-language**: Handles "Größe", "Shoe Size", etc.
- **Robust dropdowns**: Manages complex dropdown interactions
- **Fallback strategies**: Continues without variants if unavailable

### Price Filtering Innovation
- **Currency independence**: Works with USD, EUR, ILS, etc.
- **Input activation**: Handles eBay's JavaScript form validation
- **Filter application**: Automatic price range setting
- **Page restart handling**: Waits for filtered results to load

### Error Resilience
- **Screenshot capture**: Automatic failure documentation
- **Detailed logging**: Complete action tracking with timestamps
- **Graceful degradation**: Tests continue despite partial failures
- **Retry mechanisms**: Built-in retry logic for flaky elements

## 📈 Reporting & Monitoring

### Automated Reports
- **HTML Report**: Interactive test results with screenshots
- **Trace Viewer**: Step-by-step execution replay
- **CI Artifacts**: Download test results and screenshots
- **GitHub Summary**: Auto-generated test status overview

### Metrics Tracked
- Test execution time per browser
- Success/failure rates across scenarios  
- Screenshot capture on failures
- Performance benchmarks

## 🔍 Debugging

### Local Debugging
```bash
# Run with browser visible
npx playwright test --headed

# Debug mode with DevTools
npx playwright test --debug

# Trace recording
npx playwright test --trace on

# Single test debugging
npx playwright test --grep "CR1.1" --headed --debug
```

### CI Debugging
- Download artifacts from GitHub Actions
- Review test-results folder for screenshots
- Check workflow logs for detailed execution traces

## 📝 Best Practices Implemented

### Code Organization
- **Separation of concerns**: Page objects, utilities, test data separated
- **Reusable components**: Centralized locator and utility functions
- **Type safety**: Full TypeScript implementation
- **Clean abstractions**: Test code unaware of locator complexity

### Test Design
- **Independent tests**: Each test can run in isolation
- **Data-driven**: External JSON configuration
- **Comprehensive coverage**: Multiple scenarios per requirement
- **Error documentation**: Screenshots and logs for failures

## 🔒 Requirements Compliance

✅ **Smart Locator Strategy**: Multi-fallback with automatic retry  
✅ **Parallel Execution**: Cross-browser matrix testing  
✅ **Core Functions**: Search, cart, variant selection, budget verification  
✅ **Error Handling**: Screenshots, logging, graceful degradation  
✅ **CI/CD Integration**: GitHub Actions with artifact management

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- **Issues**: [GitHub Issues](https://github.com/Edishni/ness-playwright-hw/issues)
- **Documentation**: [Project Wiki](https://github.com/Edishni/ness-playwright-hw/wiki)
- **CI Status**: [GitHub Actions](https://github.com/Edishni/ness-playwright-hw/actions)

---

**Built with ❤️ using Playwright, TypeScript, and GitHub Actions**
```

Run tests:

```powershell
npx playwright test            # run all tests
npm run test:workers           # run with 3 workers
npx playwright test --project=chromium --project=firefox
```

Generate Allure report (after tests):

```powershell
npm run allure:generate
npm run allure:open
```
Frob pipeline job result we can download allure results and after extraction to run next command:
npx allure open "C:\file path...\allure-report"


Notes:
- Canonical sources are under `src/` (pages, utils, tests).
- Test data: `data/test-data.json` (simple JSON for data-driven examples).
- Locator utility: `src/utils/locator-utility.ts` implements fallback and screenshot on final failure.

Limitations:
- eBay may use anti-bot / CAPTCHA which can block automated login. Current scaffold uses guest-mode flows and conservative selector strategies.

If you want, I can now run `npm install` and a test run locally. Confirm and I'll proceed.
