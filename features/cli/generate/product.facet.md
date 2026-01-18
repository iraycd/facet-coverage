# Generate Command

The generate command transforms facet markdown files into structured JSON and TypeScript types for type-safe test coverage tracking.

## Config-Based Discovery
When run without arguments, the generate command uses `facetPattern` from config to automatically discover all facet markdown files across the project.

### Requirements

- Read facetPattern from facet.config.json, .js, or .mjs [](#read-config)
- Support both single string and array of glob patterns [](#glob-array)
- Discover files matching patterns recursively [](#recursive-discovery)
- Group discovered files by their parent feature directory [](#group-by-feature)

## Type Generation
Generate TypeScript types for each feature's facets, enabling autocomplete and compile-time verification of facet references.

### Requirements

- Generate `FacetId` union type with all valid facet IDs [](#facet-id-union)
- Generate `Facets` const object for autocomplete [](#facets-const-object)
- Generate `facet()` helper function for test annotations [](#facet-helper)
- Support `--no-types` flag to skip TypeScript generation [](#no-types-flag)

## Global Types
When `--global` flag is used, generate combined types at the project root that aggregate all features.

### Requirements

- Create `.facet/facets.ts` at project root [](#root-facets-file)
- Re-export all feature-specific types [](#re-export-types)
- Generate combined `FacetId` union across all features [](#combined-union)
- Generate combined `Facets` const with all facet IDs [](#combined-const)
