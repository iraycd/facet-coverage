# Integrations

## Type-Safe Facet Function

Export a generated `facet()` function for any testing framework with full TypeScript support.

### Requirements

- Accept variable number of facet IDs
- Provide TypeScript autocomplete via generated types
- Work with any testing framework (bun:test, jest, vitest, mocha, Playwright)
- Support constant references: `facet(Facets.BUSINESS_GUEST_PURCHASE)`
- Support multiple IDs: `facet(Facets.A, Facets.B)`
- Return metadata object for debugging and runtime introspection
- Type-check at compile time to prevent invalid facet IDs

### Usage

```typescript
import { Facets, facet } from '../.facet/facets';

test('guest can purchase', () => {
  facet(Facets.BUSINESS_GUEST_PURCHASE_FLOW);
  // ... test code
});
```

## Playwright Annotation Helper

Provide a helper function for annotating Playwright tests with facet IDs.

### Requirements

- Export `facet()` function that accepts variable number of facet IDs
- Return Playwright-compatible annotation object with type and description
- Support single or multiple facet IDs per test
- Work with Playwright's test annotation syntax

## Playwright Reporter

Integrate with Playwright's reporter API for automatic coverage tracking.

### Requirements

- Implement Playwright Reporter interface (onBegin, onTestEnd, onEnd)
- Extract facet annotations from test metadata during execution
- Only count passed tests toward coverage (failed tests excluded)
- Merge runtime execution data with static scanning
- Generate all configured report formats on test suite completion
- Print coverage summary to console
- Support configuration via reporter options
- Work alongside other Playwright reporters (html, json, etc.)
