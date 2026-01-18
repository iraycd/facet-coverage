# Configuration

## Config File Discovery

Auto-discover configuration files in multiple formats.

### Requirements

- Search for `facet.config.js` (ESM or CommonJS)
- Search for `facet.config.mjs` (ESM only)
- Search for `facet.config.json` (JSON)
- Support `--config` flag to specify custom path
- Merge with default configuration values
- Support configuration in current working directory

## Facet Patterns

Configure glob patterns for discovering facet markdown files.

### Requirements

- Support `facetPattern` as string or array
- Default patterns: `['features/**/*.facet.md', 'features/**/facets/*.md']`
- Expand patterns relative to project root
- Remove duplicate matches
- Group discovered files by feature directory

## Facet Types

Configure known facet types for constant-to-ID conversion.

### Requirements

- Support `facetTypes` array in configuration
- Default types: `['product', 'dx', 'technical', 'compliance', 'business', 'ux']`
- Use for converting `Facets.BUSINESS_X` to `business:x`
- Support hierarchical IDs in nested structures
- Allow custom types per project
