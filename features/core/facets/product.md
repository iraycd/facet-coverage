# Core Functionality

## Structure Reading {#structure-reading}

The system must read and parse structure.json files that define facets for each feature.

### Requirements

- Find structure files via glob patterns from configuration {#glob-patterns}
- Parse JSON with proper validation and error handling {#json-parsing}
- Support multiple structure files per project {#multiple-structures}
- Resolve file paths relative to structure file location {#path-resolution}
- Return all facets across all structures {#facet-aggregation}

## Markdown Parsing {#markdown-parsing}

Parse markdown documentation files to extract sections as facets.

### Requirements

- Extract headings at all levels as sections {#heading-extraction}
- Generate URL-friendly slugs from heading text {#slug-generation}
- Support explicit anchor syntax: `## Heading {#custom-slug}` {#explicit-anchors}
- Support nested heading levels with proper hierarchy {#heading-hierarchy}
- Validate that referenced sections exist in source files {#section-validation}
- Handle markdown with frontmatter and code blocks {#frontmatter-handling}

### Explicit Anchor Syntax

Create stable facet IDs that survive heading renames:

```markdown
## Guest Purchase Flow {#guest-purchase}
```

Generates `business:guest-purchase` instead of `business:guest-purchase-flow`. When the heading text changes, the facet ID remains stable.

## Test Scanning {#test-scanning}

Scan test files to find facet annotations and build test-to-facet mappings.

### Requirements

- Find test files matching configured glob patterns {#test-file-discovery}
- Support Playwright-style annotations: `annotation: facet('id')` {#playwright-annotations}
- Support comment-based annotations: `// @facet id1, id2` {#comment-annotations}
- Track describe block nesting for full test titles {#describe-nesting}
- Return test file path, title, and linked facet IDs {#test-metadata}

## Validation {#validation}

Validate the integrity of facet structures and test linkages.

### Requirements

- Detect duplicate facet IDs across structure files {#duplicate-detection}
- Verify source markdown files exist {#source-verification}
- Verify referenced sections exist in source files {#section-verification}
- Identify tests referencing non-existent facets (orphan tests) {#orphan-tests}
- Identify facets without any test coverage (uncovered facets) {#uncovered-facets}
- Return structured errors and warnings {#error-reporting}

## Coverage Calculation {#coverage-calculation}

Calculate coverage metrics across all dimensions.

### Requirements

- Calculate overall coverage percentage {#overall-coverage}
- Calculate coverage by facet type (business, compliance, ux, etc.) {#type-coverage}
- Calculate coverage per feature {#feature-coverage}
- Check coverage against configured thresholds {#threshold-checking}
- Return comprehensive coverage report with all metrics {#coverage-report}
