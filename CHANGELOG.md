# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] - 2025-01-18

### Added
- Initial release
- Core modules: StructureReader, FacetParser, TestScanner, Validator, CoverageCalculator
- CLI commands: generate, analyze, validate, watch
- Reporters: JSON, HTML, Markdown
- Playwright integration with annotation helper and reporter
- Comment-based test annotations (`// @facet id`)
- Self-coverage documentation (35 facets)
