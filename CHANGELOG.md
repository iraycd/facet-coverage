# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.4.0] - 2026-01-18

### Added
- **Sub-facet support** for fine-grained requirement tracking within sections
- Three ways to define sub-facets:
  - List item IDs: `1. **Item** {#sub-id} - description`
  - Comment markers: `<!-- @facet:sub-id -->`
  - Configurable h3+ headings: `### Subsection {#sub-id}` (requires `subFacetHeadingLevels` config)
- Hierarchical facet IDs with parent/child relationships (e.g., `compliance:pci-dss/tls`)
- `subFacetHeadingLevels` config option to control which heading levels become sub-facets
- Double underscore (`__`) convention in TypeScript constants for sub-facets (e.g., `COMPLIANCE_PCI_DSS__TLS`)
- `parentId` and `isSubFacet` fields in structure.json for sub-facet metadata
- Tests for sub-facet parsing (list items, comments, nested sub-facets)

### Changed
- TestScanner now handles `__` in constant names for sub-facet ID conversion
- Validator now validates sub-facet parent relationships
- SubFacetMarker type extended with `'heading'` type option

## [0.3.0] - 2026-01-18

### Added
- Config-based facet discovery via `facetPattern` option - run `generate` without arguments
- Support for `*.facet.md` naming convention alongside `facets/*.md`
- Nested feature support with hierarchical facet IDs (e.g., `checkout/payments/pci:section`)
- `--global` flag to generate combined types at project root `.facet/facets.ts`
- `facetTypes` config option for resolving `Facets.CONSTANT` references in tests
- Explicit ID anchors in markdown: `## Heading {#stable-id}` for stable facet IDs
- ID change detection with warnings when facet IDs change during `generate`
- `--quiet` flag to suppress ID change warnings
- Comprehensive tests for explicit anchor parsing and ID change detection

### Changed
- TestScanner now resolves `Facets.CONSTANT` references using configured `facetTypes`
- Updated facet documentation to reflect all v0.2.0 and v0.3.0 features
- Shared config loading via `loadConfig()` utility across CLI commands

## [0.2.0] - 2026-01-18

### Added
- Type-safe `facet()` function for linking tests to facet IDs with full TypeScript support
- New `generate` CLI command to create type-safe `facets.ts` files from structure.json
- Comparison documentation: How Facet differs from TDD/BDD/ATDD

### Changed
- Updated all tests to use the new `facet()` function instead of comment-based annotations
- Improved README with badges, table of contents, and better formatting

## [0.1.0] - 2025-01-18

### Added
- Initial release
- Core modules: StructureReader, FacetParser, TestScanner, Validator, CoverageCalculator
- CLI commands: generate, analyze, validate, watch
- Reporters: JSON, HTML, Markdown
- Playwright integration with annotation helper and reporter
- Comment-based test annotations (`// @facet id`)
- Self-coverage documentation (35 facets)
