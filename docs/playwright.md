# Playwright Integration

Facet Coverage provides enhanced integration with Playwright for automatic coverage tracking during test runs.

> **Note:** Playwright works with [comment annotations](getting-started.md#alternative-comment-annotations) and [generated types](getting-started.md#recommended-type-safe-facet-function) out of the box. This page covers the **optional** enhanced integration with a custom reporter and annotation helper.

## Why Use the Playwright Integration?

- **Automatic coverage on test run** - Coverage reports generated after `playwright test`
- **Runtime annotation capture** - Works with dynamic test generation
- **Native annotation syntax** - Uses Playwright's built-in annotation system

## Setup

### 1. Configure the Reporter

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

### 2. Annotate Tests

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

## Reporter Options

```typescript
{
  // Output configuration
  output: {
    dir: '.facet-coverage',           // Output directory
    formats: ['json', 'html', 'markdown']  // Report formats
  },

  // Coverage thresholds
  thresholds: {
    global: 80,                       // Overall threshold %
    byType: {
      compliance: 100,                // Per-type thresholds
      business: 80
    }
  },

  // Fail test run if thresholds not met
  failOnThreshold: true
}
```

## Using with Type-Safe Facets

Combine Playwright annotations with generated types:

```typescript
import { test } from '@playwright/test';
import { Facets } from '../.facet/facets';
import { facet } from '@facet-coverage/core/playwright';

test('checkout flow', {
  annotation: facet(
    Facets.BUSINESS_GUEST_CHECKOUT,
    Facets.COMPLIANCE_PCI_DSS
  )
}, async ({ page }) => {
  await page.goto('/checkout');
  // ...
});
```

## Alternative: In-Test facet() Calls

You can also use the standard `facet()` function inside Playwright tests:

```typescript
import { test, expect } from '@playwright/test';
import { Facets, facet } from '../.facet/facets';

test('checkout flow', async ({ page }) => {
  facet(Facets.BUSINESS_GUEST_CHECKOUT);
  facet(Facets.COMPLIANCE_PCI_DSS);

  await page.goto('/checkout');
  // ...
});
```

Both approaches work—use whichever fits your team's preference.

## CI Integration

```yaml
# .github/workflows/test.yml
- name: Run Playwright tests with facet coverage
  run: npx playwright test

- name: Upload coverage report
  uses: actions/upload-artifact@v3
  with:
    name: facet-coverage
    path: .facet-coverage/
```
