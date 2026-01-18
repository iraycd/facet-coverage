# CLI Commands

## Generate Command

Generate structure.json and TypeScript types from markdown facet files.

### Requirements

- Accept optional directory path as argument
- When no directory specified, use `facetPattern` from config
- Scan directory for markdown files (both `*.facet.md` and `facets/*.md`)
- Parse each markdown file for heading sections
- Create facet entries with auto-generated IDs (format: `type:section-slug`)
- Support explicit anchor syntax for stable IDs: `## Heading {#stable-id}`
- Write structure.json to `.facet/` directory
- Generate TypeScript types file (`facets.ts`) with type-safe constants
- Support custom output directory via `-o` flag
- Support type override via `-t` flag
- Support `--global` flag to generate combined types at root
- Support `--no-types` flag to skip TypeScript generation
- Support `-q, --quiet` flag to suppress ID change warnings

### ID Change Detection

When regenerating, detect changes to facet IDs:

- Compare new structure.json with existing
- Warn about renamed IDs (heading text changed)
- Warn about removed IDs
- Show affected tests that may need updates
- Suggest using explicit anchors for stability

### Type Generation

Generate TypeScript types for type-safe facet references:

- `FacetId` union type of all valid IDs
- `Facets` const object for autocomplete
- `facet()` helper function for test annotations
- `allFacetIds` array of all IDs

## Analyze Command

Analyze facet coverage and generate reports.

### Requirements

- Load configuration from facet.config.json or specified file
- Read all structure files
- Scan all test files for facet annotations
- Calculate coverage metrics
- Generate reports in configured formats (JSON, HTML, Markdown)
- Display coverage summary in console
- Exit with code 1 if thresholds not met (for CI/CD)
- Support `--json` flag for machine-readable output
- Support `--silent` flag to suppress console output

## Validate Command

Validate structure integrity and test-to-facet linkages.

### Requirements

- Check all structure files for validity
- Verify source files and sections exist
- Check for duplicate facet IDs
- Identify orphan tests and uncovered facets
- Display validation results with errors and warnings
- Support `--strict` mode requiring all tests to be linked
- Support `--json` flag for structured output
- Exit with code 1 if validation fails

## Watch Command

Watch for file changes and re-run analysis automatically.

### Requirements

- Monitor facet markdown files for changes
- Monitor test files for changes
- Monitor structure.json files for changes
- Re-run analysis on detected changes
- Support optional validation before analysis via `-v` flag
- Display timestamps for each analysis run
