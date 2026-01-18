# Getting Started

## Installation

```bash
bun add -d @facet-coverage/core
```

Or with npm:
```bash
npm install -D @facet-coverage/core
```

## Quick Start

### 1. Create Your First Facets

```bash
mkdir -p features/checkout/facets
```

Write requirements in natural language:

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

### 3. Link Tests to Facets

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

The `facet()` function is type-safe—TypeScript will error if you use an invalid facet ID.

### 4. Run Coverage Analysis

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

### 5. (Optional) Start Development Server

For a live dashboard with hot reload:

```bash
bunx facet serve --open
```

This opens an interactive UI showing coverage metrics, facet documentation with badges, and linked tests—all updating in real-time as you edit files.

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

## Linking Methods

### Recommended: Type-Safe `facet()` Function

```typescript
import { Facets, facet } from '../.facet/facets';

test('guest user can complete a purchase', () => {
  facet(Facets.BUSINESS_GUEST_PURCHASE_FLOW);
  facet(Facets.COMPLIANCE_PCI_DSS_PAYMENT_REQUIREMENTS);
  // ...
});

test('payment meets compliance', () => {
  // Multiple facets in one call
  facet(Facets.COMPLIANCE_PCI_DSS, Facets.COMPLIANCE_GDPR);
  // ...
});
```

### Alternative: Comment Annotations

For quick setup without imports:

```typescript
// @facet business:guest-purchase-flow, compliance:pci-dss
test('guest user completes purchase', () => {
  // Your test code
});
```

### All Methods

| Method | Type-Safe | Syntax |
|--------|-----------|--------|
| `facet()` function | Yes | `facet(Facets.ID)` inside test body |
| Comment annotation | No | `// @facet id` above test |
| Playwright annotation | Yes | `{ annotation: facet(...) }` in test options |

## Next Steps

- [Configuration](configuration.md) - Customize patterns and thresholds
- [CLI Reference](cli.md) - All available commands
- [Playwright Integration](playwright.md) - Enhanced Playwright support
- [ID Patterns](id-patterns.md) - Stable IDs and nested features
