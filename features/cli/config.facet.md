# Configuration

## Config File Discovery
Auto-discover configuration files in multiple formats.

### Requirements

- Search for `facet.config.js` (ESM or CommonJS) [](#search-js)
- Search for `facet.config.mjs` (ESM only) [](#search-mjs)
- Search for `facet.config.json` (JSON) [](#search-json)
- Support `--config` flag to specify custom path [](#config-flag)
- Merge with default configuration values [](#merge-defaults)
- Support configuration in current working directory [](#cwd-config)

## Facet Patterns
Configure glob patterns for discovering facet markdown files.

### Requirements

- Support `facetPattern` as string or array [](#pattern-types)
- Default patterns: `['features/**/*.facet.md', 'features/**/facets/*.md']` [](#default-patterns)
- Expand patterns relative to project root [](#relative-expansion)
- Remove duplicate matches [](#dedupe)
- Group discovered files by feature directory [](#group-by-feature)

## Facet Types
Configure known facet types for constant-to-ID conversion.

### Requirements

- Support `facetTypes` array in configuration [](#types-array)
- Default types: `['product', 'dx', 'technical', 'compliance', 'business', 'ux']` [](#default-types)
- Use for converting `Facets.BUSINESS_X` to `business:x` [](#constant-conversion)
- Support hierarchical IDs in nested structures [](#hierarchical-ids)
- Allow custom types per project [](#custom-types)
