<div align="center">

# Facet Coverage

**Test every facet of your features**

*Natural specifications. Multiple perspectives. Rigorous coverage.*

[![npm version](https://img.shields.io/npm/v/@facet-coverage/core.svg)](https://www.npmjs.com/package/@facet-coverage/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/iraycd/facet-coverage/tree/main.svg?style=svg)](https://dl.circleci.com/pipelines/gh/iraycd/facet-coverage)
[![Node.js Version](https://img.shields.io/node/v/@facet-coverage/core.svg)](https://nodejs.org)

</div>

---

## Table of Contents

- [What is Facet?](#what-is-facet)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Linking Tests to Facets](#linking-tests-to-facets)
- [Project Structure](#project-structure)
- [CLI Commands](#cli-commands)
- [Playwright Integration](#playwright-integration)
- [Configuration](#configuration)
- [ID Patterns](#id-patterns)
- [Programmatic API](#programmatic-api)
- [Benefits](#benefits)
- [How Facet Differs](#how-facet-differs)
- [Key Principles](#key-principles)
- [Contributing](#contributing)
- [License](#license)

---

## What is Facet?

Facet is a modern testing framework that lets you document features from multiple stakeholder perspectives while maintaining exact traceability to your tests.

**One feature. Many facets.**

| Perspective | Description |
|-------------|-------------|
| **Business requirements** | Product owner specifications |
| **Compliance mandates** | Regulatory requirements (PCI-DSS, GDPR, etc.) |
| **UX standards** | Design system and accessibility rules |
| **Technical specs** | Architecture and API contracts |

All connected to the same tests. All tracked for coverage.

---

## Installation

```bash
bun add -d @facet-coverage/core
```

---

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

### 2. Generate Structure & Types

```bash
bunx facet generate features/checkout/facets/
```

This creates two files in `features/checkout/.facet/`:
- `structure.json` - facet definitions
- `facets.ts` - TypeScript types for type-safe linking

**structure.json:**

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

Import the generated types and use `facet()` in your tests:

```typescript
// features/checkout/tests/checkout.spec.ts
import { test, expect } from 'bun:test';  // or jest, vitest, mocha...
import { Facets, facet } from '../.facet/facets';

test('guest user completes purchase', () => {
  // Declare which facets this test covers
  facet(Facets.BUSINESS_GUEST_PURCHASE_FLOW);
  facet(Facets.COMPLIANCE_PCI_DSS_PAYMENT_REQUIREMENTS);

  // Your test code
  const order = checkout(cart, 'user@example.com', '4242...');
  expect(order.confirmed).toBe(true);
  expect(order.maskedCard).toBe('•••• 4242');  // PCI-DSS compliance
});
```

The `facet()` function is type-safe - TypeScript will error if you use an invalid facet ID!

### 4. Run Coverage

```bash
bunx facet analyze
```

**Output:**
```
Facet Coverage Report

Overall: 100%

By Type:
  business: 100% (1/1)
  compliance: 100% (1/1)

Reports generated:
  .facet-coverage/coverage.json
  .facet-coverage/coverage.html
  .facet-coverage/coverage.md
```

---

## Project Structure

```
project/
├── features/
│   ├── checkout/
│   │   ├── facets/
│   │   │   ├── business.md      # Product owner writes
│   │   │   ├── compliance.md    # Compliance team writes
│   │   │   └── ux.md            # UX designer writes
│   │   ├── .facet/
│   │   │   ├── structure.json   # Generated facet definitions
│   │   │   └── facets.ts        # Generated TypeScript types
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

---

## Linking Tests to Facets

Use the `facet()` function inside your tests - just like `expect()` but for coverage tracking!

### Recommended: Type-Safe with `facet()` Function

```typescript
import { test, expect } from 'bun:test';  // or jest, vitest, mocha...
import { Facets, facet } from '../.facet/facets';

test('guest user can complete a purchase', () => {
  // Declare which facets this test covers - type-safe with autocomplete!
  facet(Facets.BUSINESS_GUEST_PURCHASE_FLOW);
  facet(Facets.COMPLIANCE_PCI_DSS_PAYMENT_REQUIREMENTS);

  // Your test code
  const order = checkout(cart, email, card);
  expect(order.confirmed).toBe(true);
});

test('payment meets compliance', () => {
  // Multiple facets in one call
  facet(Facets.COMPLIANCE_PCI_DSS, Facets.COMPLIANCE_GDPR);

  expect(payment.encrypted).toBe(true);
});
```

**Benefits:**
- Full TypeScript autocomplete
- Compile-time validation (invalid facet IDs cause errors)
- Clean, readable syntax
- Works with any testing framework

**Generated `facets.ts` includes:**
- `FacetId` - Union type of all valid facet IDs
- `Facets` - Object with constants for each facet
- `facet()` - Type-safe function to declare coverage

### Alternative: Comment Annotations

For quick setup without imports, use comment annotations:

```typescript
// @facet business:guest-purchase-flow, compliance:pci-dss
test('guest user completes purchase', () => {
  // Your test code
});
```

### All Linking Methods

| Method | Type-Safe | Syntax |
|--------|-----------|--------|
| `facet()` function | Yes | `facet(Facets.ID)` inside test body |
| Comment annotation | No | `// @facet id` above test |
| Playwright annotation | Yes | `{ annotation: facet(...) }` in test options |

---

## CLI Commands

### Generate Structure & Types

```bash
# Generate structure.json and facets.ts from facet documents
bunx facet generate <facets-dir>

# Options
bunx facet generate features/checkout/facets/ -o ./custom-output  # Custom output dir
bunx facet generate features/checkout/facets/ -t business         # Override type
bunx facet generate features/checkout/facets/ --no-types          # Skip TypeScript generation
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

---

## Playwright Integration

> **Note:** Playwright works with [comment annotations](#method-1-comment-annotations-any-framework) and [generated types](#method-2-type-safe-with-generated-types-recommended) out of the box. This section covers the **optional** enhanced integration with a custom reporter and annotation helper.

### Why Use the Playwright Integration?

- **Automatic coverage on test run** - Coverage reports generated after `playwright test`
- **Runtime annotation capture** - Works with dynamic test generation
- **Native annotation syntax** - Uses Playwright's built-in annotation system

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

---

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

---

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

---

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

---

## Benefits

<table>
<tr>
<td width="50%">

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

</td>
<td width="50%">

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

</td>
</tr>
</table>

---

## How Facet Differs

| Approach | Focus | Facet's Difference |
|----------|-------|-------------------|
| **TDD** | Code correctness via unit tests | Facet tracks *what* is covered, not *how* to write code |
| **BDD** | Behavior via Given-When-Then | Facet uses free-form natural language, not structured syntax |
| **ATDD** | Acceptance criteria drive development | Facet maps multiple perspectives to tests, not just acceptance |
| **Traditional Coverage** | Lines/branches executed | Facet measures *requirement* coverage, not code coverage |

**Key insight:** TDD/BDD/ATDD are *development methodologies*. Facet is a *coverage framework*. Use them together.

### Why Facet Works for AI-Driven Testing

AI coding assistants excel at generating tests but struggle with *what to test*. Facet solves this:

- **Natural language specs** → AI understands requirements without parsing Gherkin
- **Multi-perspective facets** → AI generates tests covering business, compliance, UX in one pass
- **Type-safe linking** → AI can programmatically verify coverage completeness
- **Gap detection** → AI identifies untested facets and generates missing tests

```
Human: "Generate tests for checkout"
AI: Reads facets → Understands business rules, PCI compliance, UX requirements → Generates comprehensive tests → Links to facets automatically
```

Facet bridges human intent and AI execution with traceable, verifiable coverage.

---

## Key Principles

| Principle | Description |
|-----------|-------------|
| **Multi-Perspective** | Every feature has multiple facets |
| **Natural Language** | Write like humans, not machines |
| **Evolutionary** | Documentation grows with understanding |
| **Traceable** | Exact test-to-facet mapping |
| **Feature-Modular** | Self-contained, team-owned |
| **Lightweight** | Markdown + JSON, nothing heavy |
| **Flexible** | Adopt incrementally, customize freely |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Report Bug](https://github.com/iraycd/facet-coverage/issues) | [Request Feature](https://github.com/iraycd/facet-coverage/issues)**

If you find this project useful, please consider giving it a star!

</div>
