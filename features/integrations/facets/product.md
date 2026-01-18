# Integrations

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
