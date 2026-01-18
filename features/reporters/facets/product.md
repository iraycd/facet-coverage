# Report Generation

## JSON Reporter

Generate machine-readable JSON coverage reports.

### Requirements

- Output complete coverage data as JSON
- Include timestamp of report generation
- Include summary with total, covered, uncovered counts and percentage
- Include coverage breakdown by type
- Include coverage breakdown by feature
- Include list of all tests with their facet linkages
- Include list of uncovered facets
- Write to configurable output directory

## HTML Reporter

Generate interactive HTML coverage dashboards.

### Requirements

- Generate self-contained HTML file (no external dependencies)
- Display overall coverage percentage prominently
- Show color-coded coverage bars (green/yellow/red)
- Show coverage breakdown by type in grid layout
- Show expandable feature cards with facet details
- List uncovered facets with source information
- Show which tests cover each facet
- Support dark theme for readability
- Include responsive design for various screen sizes

## Markdown Reporter

Generate human-readable Markdown coverage reports.

### Requirements

- Generate valid Markdown document
- Include generation timestamp
- Include summary table with key metrics
- Include coverage by type table
- Include per-feature sections with facet lists
- Use emoji indicators for coverage status
- List tests covering each facet
- List all uncovered facets at the end
- Suitable for Git repositories and documentation
