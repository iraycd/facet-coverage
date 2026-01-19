# Facet Coverage

Multi-stakeholder test coverage tracking tool. Write requirements in Markdown, link them to tests, track coverage across business, compliance, UX, and technical perspectives.

## Quick Reference

```bash
bun run build          # Build the project
bun run test           # Run tests
bunx facet generate    # Generate .facet structures from markdown
bunx facet analyze     # Analyze coverage and generate reports
bunx facet serve       # Start dev server with live dashboard
```

## Architecture

```
src/
├── cli/                    # CLI commands
│   ├── commands/
│   │   ├── analyze.ts      # Coverage analysis command
│   │   ├── generate.ts     # Structure generation from markdown
│   │   ├── serve.ts        # Development server
│   │   ├── validate.ts     # Validation command
│   │   └── watch.ts        # File watcher
│   └── index.ts            # CLI entry point
├── core/                   # Core business logic
│   ├── FacetParser.ts      # Parses markdown files into facets
│   ├── StructureReader.ts  # Reads .facet/structure.json files
│   ├── TestScanner.ts      # Scans test files for facet() calls
│   ├── CoverageCalculator.ts # Calculates coverage metrics
│   ├── Validator.ts        # Validates facet/test relationships
│   └── IDChangeDetector.ts # Detects ID changes between runs
├── reporters/              # Output format generators
│   ├── JsonReporter.ts     # JSON output
│   ├── MarkdownReporter.ts # Markdown output
│   └── HtmlReporter.ts     # HTML dashboard output
├── server/                 # Dev server with hot reload
│   ├── DevServer.ts        # HTTP server
│   ├── HotReloadManager.ts # File watching and reload
│   ├── routes.ts           # API routes
│   └── views/              # Server-rendered HTML templates
├── integrations/
│   └── playwright.ts       # Playwright test integration
├── types.ts                # All TypeScript types
└── index.ts                # Public API exports
```

## Key Concepts

### Facet
A trackable requirement from any stakeholder. Defined in markdown files with headings:
```markdown
## Payment Processing [](#payment)
Must support credit cards and PayPal.
```

### Sub-facet
Granular requirements under a parent facet using `[](#id)` syntax:
```markdown
## PCI-DSS Requirements
1. **TLS encryption** [](#tls) - Require TLS 1.2+
2. **No CVV storage** [](#cvv) - Never persist CVV
```

### Facet Types
Standard types: `product`, `dx`, `technical`, `compliance`, `business`, `ux`, `config`

### Structure File
Generated `.facet/structure.json` files that map facets to their sources.

### Test Linking
Tests reference facets via generated constants:
```typescript
import { Facets, facet } from '../.facet/facets';
test('payment works', () => {
  facet(Facets.COMPLIANCE_PCI_DSS__TLS);
  // test code
});
```

## Project Structure

```
features/              # Example features with facets and tests
├── checkout/
│   ├── facets/       # Markdown requirement files
│   │   ├── business.md
│   │   └── compliance.md
│   ├── tests/        # Test files
│   │   └── checkout.spec.ts
│   └── .facet/       # Generated files
│       ├── structure.json
│       └── facets.ts
docs/                  # User documentation
src/                   # Source code
```

## Configuration (facet.config.ts)

```typescript
export default {
  structureFiles: ['features/**/.facet/structure.json'],
  testDir: './features/**/tests',
  testPatterns: ['**/*.spec.ts', '**/*.test.ts'],
  facetPattern: ['features/**/*.facet.md', 'features/**/facets/*.md'],
  facetTypes: ['product', 'dx', 'technical', 'compliance', 'business', 'ux'],
  output: {
    dir: '.facet-coverage',
    formats: ['json', 'html', 'markdown']
  },
  thresholds: { global: 75 }
}
```

## Common Tasks

### Adding a new facet type
1. Add type to `facetTypes` in config
2. Create markdown file: `features/{feature}/facets/{type}.md`
3. Run `bunx facet generate` to update structures

### Creating a new feature
1. Create directory: `features/{name}/`
2. Add facet files: `features/{name}/facets/*.md`
3. Run `bunx facet generate`
4. Import generated facets in tests

### Debugging coverage
1. Run `bunx facet analyze --verbose`
2. Check `.facet-coverage/coverage.json` for details
3. Use `bunx facet serve` for interactive dashboard

## Types (src/types.ts)

Key interfaces:
- `Facet` - Single requirement with id, source, type, title
- `FacetStructure` - Feature with list of facets
- `TestLink` - Test file linking to facet IDs
- `CoverageReport` - Full coverage analysis result
- `FacetConfig` - Configuration options

## Testing

```bash
bun run test                  # Core tests only
bun run test:all              # All tests including examples
bun test features/core        # Specific feature tests
```

Test files use `.spec.ts` or `.test.ts` extension.

## Output Formats

Generated reports go to `.facet-coverage/`:
- `coverage.json` - Machine-readable, full data
- `coverage.md` - GitHub-friendly markdown
- `coverage.html` - Interactive dashboard
