# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

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
