# Generate Command

The generate command transforms facet markdown files into structured JSON and TypeScript types for type-safe test coverage tracking.

## Config-Based Discovery

When run without arguments, the generate command uses `facetPattern` from config to automatically discover all facet markdown files across the project.

### Requirements

- Read facetPattern from facet.config.json, .js, or .mjs
- Support both single string and array of glob patterns
- Discover files matching patterns recursively
- Group discovered files by their parent feature directory

## Type Generation

Generate TypeScript types for each feature's facets, enabling autocomplete and compile-time verification of facet references.

### Requirements

- Generate `FacetId` union type with all valid facet IDs
- Generate `Facets` const object for autocomplete
- Generate `facet()` helper function for test annotations
- Support `--no-types` flag to skip TypeScript generation

## Global Types

When `--global` flag is used, generate combined types at the project root that aggregate all features.

### Requirements

- Create `.facet/facets.ts` at project root
- Re-export all feature-specific types
- Generate combined `FacetId` union across all features
- Generate combined `Facets` const with all facet IDs
