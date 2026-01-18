# Report Generation

## JSON Reporter
Generate machine-readable JSON coverage reports.

### Requirements

- Output complete coverage data as JSON [](#json-output)
- Include timestamp of report generation [](#json-timestamp)
- Include summary with total, covered, uncovered counts and percentage [](#json-summary)
- Include coverage breakdown by type [](#json-type-breakdown)
- Include coverage breakdown by feature [](#json-feature-breakdown)
- Include list of all tests with their facet linkages [](#json-test-list)
- Include list of uncovered facets [](#json-uncovered)
- Write to configurable output directory [](#json-output-dir)

## HTML Reporter
Generate interactive HTML coverage dashboards.

### Requirements

- Generate self-contained HTML file (no external dependencies) [](#html-self-contained)
- Display overall coverage percentage prominently [](#html-overall-display)
- Show color-coded coverage bars (green/yellow/red) [](#html-color-bars)
- Show coverage breakdown by type in grid layout [](#html-type-grid)
- Show expandable feature cards with facet details [](#html-feature-cards)
- List uncovered facets with source information [](#html-uncovered-list)
- Show which tests cover each facet [](#html-test-coverage)
- Support dark theme for readability [](#html-dark-theme)
- Include responsive design for various screen sizes [](#html-responsive)

## Markdown Reporter
Generate human-readable Markdown coverage reports.

### Requirements

- Generate valid Markdown document [](#md-valid)
- Include generation timestamp [](#md-timestamp)
- Include summary table with key metrics [](#md-summary-table)
- Include coverage by type table [](#md-type-table)
- Include per-feature sections with facet lists [](#md-feature-sections)
- Use emoji indicators for coverage status [](#md-emoji-indicators)
- List tests covering each facet [](#md-test-list)
- List all uncovered facets at the end [](#md-uncovered-list)
- Suitable for Git repositories and documentation [](#md-git-friendly)
