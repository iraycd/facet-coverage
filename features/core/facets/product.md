# Core Functionality

## Structure Reading

The system must read and parse structure.json files that define facets for each feature.

### Requirements

- Find structure files via glob patterns from configuration
- Parse JSON with proper validation and error handling
- Support multiple structure files per project
- Resolve file paths relative to structure file location
- Return all facets across all structures

## Markdown Parsing

Parse markdown documentation files to extract sections as facets.

### Requirements

- Extract headings at all levels as sections
- Generate URL-friendly slugs from heading text
- Support nested heading levels with proper hierarchy
- Validate that referenced sections exist in source files
- Handle markdown with frontmatter and code blocks

## Test Scanning

Scan test files to find facet annotations and build test-to-facet mappings.

### Requirements

- Find test files matching configured glob patterns
- Support Playwright-style annotations: `annotation: facet('id')`
- Support comment-based annotations: `// @facet id1, id2`
- Track describe block nesting for full test titles
- Return test file path, title, and linked facet IDs

## Validation

Validate the integrity of facet structures and test linkages.

### Requirements

- Detect duplicate facet IDs across structure files
- Verify source markdown files exist
- Verify referenced sections exist in source files
- Identify tests referencing non-existent facets (orphan tests)
- Identify facets without any test coverage (uncovered facets)
- Return structured errors and warnings

## Coverage Calculation

Calculate coverage metrics across all dimensions.

### Requirements

- Calculate overall coverage percentage
- Calculate coverage by facet type (business, compliance, ux, etc.)
- Calculate coverage per feature
- Check coverage against configured thresholds
- Return comprehensive coverage report with all metrics
