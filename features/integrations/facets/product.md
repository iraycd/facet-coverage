# Integrations

## Type-Safe Facet Function
Export a generated `facet()` function for any testing framework with full TypeScript support.

### Requirements

- Accept variable number of facet IDs [](#variadic-args)
- Provide TypeScript autocomplete via generated types [](#typescript-autocomplete)
- Work with any testing framework (bun:test, jest, vitest, mocha, Playwright) [](#framework-agnostic)
- Support constant references: `facet(Facets.BUSINESS_GUEST_PURCHASE)` [](#constant-refs)
- Support multiple IDs: `facet(Facets.A, Facets.B)` [](#multiple-ids)
- Return metadata object for debugging and runtime introspection [](#metadata-return)
- Type-check at compile time to prevent invalid facet IDs [](#compile-time-check)

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

- Export `facet()` function that accepts variable number of facet IDs [](#pw-facet-function)
- Return Playwright-compatible annotation object with type and description [](#pw-annotation-object)
- Support single or multiple facet IDs per test [](#pw-multiple-ids)
- Work with Playwright's test annotation syntax [](#pw-test-syntax)

## Playwright Reporter
Integrate with Playwright's reporter API for automatic coverage tracking.

### Requirements

- Implement Playwright Reporter interface (onBegin, onTestEnd, onEnd) [](#pw-reporter-interface)
- Extract facet annotations from test metadata during execution [](#pw-extract-annotations)
- Only count passed tests toward coverage (failed tests excluded) [](#pw-passed-only)
- Merge runtime execution data with static scanning [](#pw-merge-data)
- Generate all configured report formats on test suite completion [](#pw-report-formats)
- Print coverage summary to console [](#pw-console-summary)
- Support configuration via reporter options [](#pw-config-options)
- Work alongside other Playwright reporters (html, json, etc.) [](#pw-other-reporters)
