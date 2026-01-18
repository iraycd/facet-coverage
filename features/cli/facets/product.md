# CLI Commands

## Generate Command {#generate}

Generate structure.json and TypeScript types from markdown facet files.

### Requirements

- Accept optional directory path as argument {#directory-argument}
- When no directory specified, use `facetPattern` from config {#config-pattern}
- Scan directory for markdown files (both `*.facet.md` and `facets/*.md`) {#file-scanning}
- Parse each markdown file for heading sections {#heading-parsing}
- Create facet entries with auto-generated IDs (format: `type:section-slug`) {#auto-ids}
- Support explicit anchor syntax for stable IDs: `## Heading {#stable-id}` {#explicit-anchor-syntax}
- Write structure.json to `.facet/` directory {#structure-output}
- Generate TypeScript types file (`facets.ts`) with type-safe constants {#types-generation}
- Support custom output directory via `-o` flag {#output-flag}
- Support type override via `-t` flag {#type-flag}
- Support `--global` flag to generate combined types at root {#global-flag}
- Support `--no-types` flag to skip TypeScript generation {#no-types-flag}
- Support `-q, --quiet` flag to suppress ID change warnings {#quiet-flag}

### ID Change Detection {#id-change-detection}

When regenerating, detect changes to facet IDs:

- Compare new structure.json with existing {#compare-structures}
- Warn about renamed IDs (heading text changed) {#warn-renames}
- Warn about removed IDs {#warn-removals}
- Show affected tests that may need updates {#show-affected-tests}
- Suggest using explicit anchors for stability {#suggest-anchors}

### Type Generation {#type-gen}

Generate TypeScript types for type-safe facet references:

- `FacetId` union type of all valid IDs {#facet-id-type}
- `Facets` const object for autocomplete {#facets-const}
- `facet()` helper function for test annotations {#facet-function}
- `allFacetIds` array of all IDs {#all-facet-ids}

## Analyze Command {#analyze}

Analyze facet coverage and generate reports.

### Requirements

- Load configuration from facet.config.json or specified file {#config-loading}
- Read all structure files {#structure-reading}
- Scan all test files for facet annotations {#test-scanning}
- Calculate coverage metrics {#coverage-metrics}
- Generate reports in configured formats (JSON, HTML, Markdown) {#report-generation}
- Display coverage summary in console {#console-summary}
- Exit with code 1 if thresholds not met (for CI/CD) {#threshold-exit}
- Support `--json` flag for machine-readable output {#json-flag}
- Support `--silent` flag to suppress console output {#silent-flag}

## Validate Command {#validate}

Validate structure integrity and test-to-facet linkages.

### Requirements

- Check all structure files for validity {#structure-validity}
- Verify source files and sections exist {#source-verification}
- Check for duplicate facet IDs {#duplicate-check}
- Identify orphan tests and uncovered facets {#orphan-detection}
- Display validation results with errors and warnings {#validation-display}
- Support `--strict` mode requiring all tests to be linked {#strict-mode}
- Support `--json` flag for structured output {#json-output}
- Exit with code 1 if validation fails {#validation-exit}

## Watch Command {#watch}

Watch for file changes and re-run analysis automatically.

### Requirements

- Monitor facet markdown files for changes {#monitor-facets}
- Monitor test files for changes {#monitor-tests}
- Monitor structure.json files for changes {#monitor-structures}
- Re-run analysis on detected changes {#rerun-analysis}
- Support optional validation before analysis via `-v` flag {#validate-flag}
- Display timestamps for each analysis run {#timestamps}
