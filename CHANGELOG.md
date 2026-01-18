# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.5.0] - 2026-01-19

### Added
- **Development server with hot reload** via `facet serve` command
  - Real-time coverage dashboard with WebSocket updates
  - Interactive facet documentation viewer with coverage badges
  - View test source code directly from the UI
  - Hot reload when facet files or tests change
- Configurable server options: `--port`, `--host`, `--open` (auto-open browser)
- Preact-based single-page application for the dashboard
- File watching with debounced updates for smooth development experience

### Changed
- **FacetParser** now skips code blocks and inline backticks when parsing sub-facets (prevents false positives)
- Build process now includes client bundle compilation

## [0.4.1] - 2026-01-18

### Changed
- **Unified anchor syntax**: Replaced `{#id}` pattern with invisible link `[](#id)` for all use cases
  - Heading explicit IDs: Place `[](#id)` on the line after the heading
  - Sub-facet markers: Use `[](#id)` inline with content
- Removed `'list-item'` sub-facet type (now all use `'link'` type)
- Updated all documentation to use the new `[](#id)` syntax

### Removed
- `{#id}` syntax for heading anchors (use `[](#id)` on next line instead)
- `{#id}` syntax for list item sub-facets (use `[](#id)` inline instead)

## [0.4.0] - 2026-01-18

### Added
- **Sub-facet support** for fine-grained requirement tracking within sections
- Two ways to define sub-facets:
  - Invisible link anchors: `1. **Item** [](#sub-id) - description`
  - Comment markers: `<!-- @facet:sub-id -->`
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
- Explicit ID anchors in markdown: `[](#stable-id)` on line after heading for stable facet IDs
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
