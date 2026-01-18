# Facet Coverage

> **Test every facet of your features**
> Natural specifications. Multiple perspectives. Rigorous coverage.

## What is Facet?

Facet is a modern testing framework that lets you document features from multiple stakeholder perspectives while maintaining exact traceability to your tests.

**One feature. Many facets.**
- Business requirements
- Compliance mandates
- UX standards
- Technical specs

All connected to the same tests. All tracked for coverage.

## Installation

```bash
bun add -d @facet-coverage/core
```

## Quick Start

### 1. Create Your First Facets

```bash
mkdir -p features/checkout/facets
```

Write in natural language:

**features/checkout/facets/business.md**
```markdown
## Guest Purchase Flow

A user who isn't logged in should be able to buy products. They add
items to cart, click checkout, provide email and payment details,
and get an order confirmation.

### Edge Cases
- Empty cart at checkout
- Invalid email format
- Payment gateway timeout
```

**features/checkout/facets/compliance.md**
```markdown
## PCI-DSS Payment Requirements

We handle credit card data, so PCI-DSS compliance is mandatory:

1. **Encryption in transit** - TLS 1.2+ required
2. **No CVV storage** - Use payment gateway, never store CVV
3. **Card masking** - Display only last 4 digits
```

### 2. Generate Structure

```bash
bunx facet generate features/checkout/facets/
```

This creates `features/checkout/.facet/structure.json`:

```json
{
  "feature": "checkout",
  "facets": [
    {
      "id": "business:guest-purchase-flow",
      "source": {
        "file": "facets/business.md",
        "section": "guest-purchase-flow"
      },
      "type": "business"
    },
    {
      "id": "compliance:pci-dss-payment-requirements",
      "source": {
        "file": "facets/compliance.md",
        "section": "pci-dss-payment-requirements"
      },
      "type": "compliance"
    }
  ]
}
```

### 3. Link Tests

```typescript
// features/checkout/tests/checkout.spec.ts
import { test, expect } from '@playwright/test';
import { facet } from '@facet-coverage/core/playwright';

test('guest user completes purchase', {
  annotation: facet(
    'business:guest-purchase-flow',
    'compliance:pci-dss-payment-requirements'
  )
}, async ({ page }) => {
  await page.goto('/checkout');
  // ... test code

  // Verify compliance: card masking
  const maskedCard = page.locator('.card-last-four');
  await expect(maskedCard).toHaveText('•••• 4242');
});
```

### 4. Run Coverage

```bash
bunx facet analyze
```

**Output:**
```
💎 Facet Coverage Report

Overall: 100%

By Type:
  ✅ business: 100% (1/1)
  ✅ compliance: 100% (1/1)

Reports generated:
  📄 .facet-coverage/coverage.json
  📄 .facet-coverage/coverage.html
  📄 .facet-coverage/coverage.md
```

## Project Structure

```
project/
├── features/
│   ├── checkout/
│   │   ├── facets/
│   │   │   ├── business.md      # Product owner writes
│   │   │   ├── compliance.md    # Compliance team writes
│   │   │   └── ux.md           # UX designer writes
│   │   ├── .facet/
│   │   │   └── structure.json   # Generated or manual
│   │   └── tests/
│   │       └── checkout.spec.ts
│   │
│   └── authentication/
│       ├── facets/
│       ├── .facet/
│       └── tests/
│
├── .facet-coverage/              # Coverage reports
│   ├── coverage.json
│   ├── coverage.html
│   └── coverage.md
│
└── facet.config.js               # Configuration
```

## CLI Commands

### Generate Structure

```bash
# Generate structure from facet documents
bunx facet generate <facets-dir>

# Options
bunx facet generate features/checkout/facets/ -o ./custom-output
bunx facet generate features/checkout/facets/ -t business
```

### Analyze Coverage

```bash
# Run coverage analysis
bunx facet analyze

# Options
bunx facet analyze -c facet.config.js    # Custom config
bunx facet analyze -f html               # Specific format
bunx facet analyze -t 80                 # Set threshold
bunx facet analyze --json                # JSON output for CI
bunx facet analyze --silent              # No console output
```

### Validate

```bash
# Validate structure and test links
bunx facet validate

# Options
bunx facet validate --strict    # Require all tests linked
bunx facet validate --json      # JSON output
```

### Watch Mode

```bash
# Re-run on changes
bunx facet watch

# Options
bunx facet watch -v    # Validate before analysis
```

## Playwright Integration

### Reporter Setup

```typescript
// playwright.config.ts
import { FacetCoverageReporter } from '@facet-coverage/core/playwright';

export default {
  reporter: [
    ['html'],
    [FacetCoverageReporter, {
      output: {
        dir: '.facet-coverage',
        formats: ['json', 'html', 'markdown']
      },
      thresholds: {
        global: 80,
        byType: {
          compliance: 100
        }
      }
    }]
  ]
};
```

### Test Annotations

```typescript
import { test } from '@playwright/test';
import { facet } from '@facet-coverage/core/playwright';

// Single facet
test('my test', {
  annotation: facet('guest-checkout-flow')
}, async ({ page }) => {
  // ...
});

// Multiple facets
test('comprehensive test', {
  annotation: facet(
    'guest-checkout-flow',
    'pci-card-masking',
    'mobile-checkout-ux'
  )
}, async ({ page }) => {
  // ...
});
```

## Configuration

**facet.config.js:**

```javascript
export default {
  // Where structure files live
  structureFiles: [
    'features/**/.facet/structure.json'
  ],

  // Where tests live
  testDir: './features/**/tests',
  testPatterns: ['**/*.spec.ts', '**/*.test.ts'],

  // Validation options
  validation: {
    requireSourceExists: true,
    requireSectionExists: true,
    requireAllTestsLinked: false
  },

  // Output options
  output: {
    dir: '.facet-coverage',
    formats: ['json', 'html', 'markdown']
  },

  // Coverage thresholds
  thresholds: {
    global: 75,
    byType: {
      compliance: 100,
      business: 80,
      ux: 70
    }
  }
};
```

## ID Patterns

### Auto-Generated (Recommended)

```
Pattern: {filename}:{section-slug}

Examples:
- business:guest-purchase-flow
- compliance:pci-dss-payment-requirements
- ux:mobile-checkout-experience
```

### Custom Slugs

```json
{
  "id": "guest-checkout-flow",
  "source": {
    "file": "facets/business.md",
    "section": "guest-purchase-flow"
  },
  "type": "business"
}
```

### Flexible Linking

```typescript
// All three formats work:
facet('guest-checkout-flow')                      // Custom slug
facet('business:guest-purchase-flow')             // Auto-generated
facet('facets/business.md#guest-purchase-flow')   // Direct path
```

## Programmatic API

```typescript
import {
  StructureReader,
  TestScanner,
  CoverageCalculator,
  Validator,
  JsonReporter,
  HtmlReporter,
  MarkdownReporter
} from '@facet-coverage/core';

// Read structures
const reader = new StructureReader();
const structures = await reader.readAllStructures();

// Scan tests
const scanner = new TestScanner();
const tests = await scanner.scanAllTests();

// Calculate coverage
const calculator = new CoverageCalculator();
const report = await calculator.calculateCoverage();

// Validate
const validator = new Validator();
const result = await validator.validate();

// Generate reports
const jsonReporter = new JsonReporter();
jsonReporter.write(report);

const htmlReporter = new HtmlReporter();
htmlReporter.write(report);

const mdReporter = new MarkdownReporter();
mdReporter.write(report);
```

## Benefits

### For Product Owners
- Write in natural language
- Focus on business value
- See what's tested immediately
- Documentation evolves with product

### For Compliance Teams
- Direct regulation mapping
- Audit-ready traceability
- 100% coverage enforcement
- Automated compliance reports

### For UX Designers
- Document user flows naturally
- Link designs to tests
- Track accessibility coverage
- Mobile/desktop requirements clear

### For Developers
- One test covers multiple facets
- Clear requirements from all stakeholders
- Know exactly what's covered
- Easy maintenance

### For QA Teams
- Complete visibility
- Automated gap detection
- Multi-perspective coverage
- Progress tracking

## Key Principles

1. **Multi-Perspective**: Every feature has multiple facets
2. **Natural Language**: Write like humans, not machines
3. **Evolutionary**: Documentation grows with understanding
4. **Traceable**: Exact test-to-facet mapping
5. **Feature-Modular**: Self-contained, team-owned
6. **Lightweight**: Markdown + JSON, nothing heavy
7. **Flexible**: Adopt incrementally, customize freely

## License

MIT
