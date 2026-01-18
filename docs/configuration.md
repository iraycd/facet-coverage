# Configuration

Facet Coverage supports multiple configuration file formats. The CLI looks for config files in this order:

1. `facet.config.js` (ESM or CommonJS)
2. `facet.config.mjs` (ESM only)
3. `facet.config.json` (JSON)

## Configuration Formats

### JavaScript (ESM)

```javascript
// facet.config.js
export default {
  // Glob pattern(s) for finding facet markdown files
  facetPattern: ['features/**/*.facet.md', 'features/**/facets/*.md'],

  // Where structure files are generated
  structureFiles: ['features/**/.facet/structure.json'],

  // Where tests live
  testDir: './features/**/tests',
  testPatterns: ['**/*.spec.ts', '**/*.test.ts'],

  // Known facet types for Facets.CONSTANT resolution
  facetTypes: ['product', 'dx', 'technical', 'compliance', 'business', 'ux'],

  // Heading levels that become sub-facets
  subFacetHeadingLevels: [3],  // h3 headings become sub-facets

  // Validation options
  validation: {
    requireSourceExists: true,
    requireSectionExists: true,
    requireAllTestsLinked: false
  },

  // Output options
  output: {
    dir: '.facet-coverage',
    formats: ['json', 'html', 'markdown']
  },

  // Coverage thresholds
  thresholds: {
    global: 75,
    byType: {
      compliance: 100,
      business: 80,
      ux: 70
    }
  }
};
```

### JSON

```json
{
  "facetPattern": ["features/**/*.facet.md", "features/**/facets/*.md"],
  "structureFiles": ["features/**/.facet/structure.json"],
  "testDir": "./features/**/tests",
  "testPatterns": ["**/*.spec.ts", "**/*.test.ts"],
  "facetTypes": ["product", "dx", "technical", "compliance", "business", "ux"],
  "subFacetHeadingLevels": [3],
  "validation": {
    "requireSourceExists": true,
    "requireSectionExists": true,
    "requireAllTestsLinked": false
  },
  "output": {
    "dir": ".facet-coverage",
    "formats": ["json", "html", "markdown"]
  },
  "thresholds": {
    "global": 75,
    "byType": {
      "compliance": 100
    }
  }
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `facetPattern` | `string \| string[]` | `['features/**/*.facet.md', 'features/**/facets/*.md']` | Glob pattern(s) for finding facet files |
| `structureFiles` | `string[]` | `['features/**/.facet/structure.json']` | Glob patterns for structure files |
| `testDir` | `string` | `'./features/**/tests'` | Test directory pattern |
| `testPatterns` | `string[]` | `['**/*.spec.ts', '**/*.test.ts']` | Test file patterns |
| `facetTypes` | `string[]` | `['product', 'dx', 'technical', ...]` | Known types for `Facets.CONSTANT` resolution |
| `subFacetHeadingLevels` | `number[]` | `[]` | Heading levels that become sub-facets (e.g., `[3]` for h3) |
| `validation.requireSourceExists` | `boolean` | `true` | Check if source files exist |
| `validation.requireSectionExists` | `boolean` | `true` | Check if sections exist in files |
| `validation.requireAllTestsLinked` | `boolean` | `false` | Require every test links to a facet |
| `output.dir` | `string` | `'.facet-coverage'` | Output directory for reports |
| `output.formats` | `string[]` | `['json', 'html', 'markdown']` | Report formats to generate |
| `thresholds.global` | `number` | `75` | Overall coverage threshold % |
| `thresholds.byType` | `object` | `{}` | Per-type coverage thresholds |

## Example: Strict Compliance Setup

For regulated industries where compliance coverage must be 100%:

```javascript
// facet.config.js
export default {
  facetPattern: ['features/**/facets/*.md'],

  validation: {
    requireSourceExists: true,
    requireSectionExists: true,
    requireAllTestsLinked: true  // Every test must link to a facet
  },

  thresholds: {
    global: 90,
    byType: {
      compliance: 100,  // Must have 100% compliance coverage
      security: 100,    // Must have 100% security coverage
      business: 80,
      ux: 70
    }
  }
};
```

## Example: Monorepo Setup

For monorepos with multiple packages:

```javascript
// facet.config.js
export default {
  facetPattern: [
    'packages/*/features/**/*.facet.md',
    'packages/*/features/**/facets/*.md'
  ],
  structureFiles: ['packages/*/features/**/.facet/structure.json'],
  testDir: './packages/*/features/**/tests',
  testPatterns: ['**/*.spec.ts', '**/*.test.ts']
};
```
