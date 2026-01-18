# CLI Commands

## Generate Command

Generate structure.json from markdown facet files.

### Requirements

- Accept directory path as argument
- Scan directory for markdown files
- Parse each markdown file for heading sections
- Create facet entries with auto-generated IDs (format: `type:section-slug`)
- Write structure.json to `.facet/` directory
- Support custom output directory via `-o` flag
- Support type override via `-t` flag

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
