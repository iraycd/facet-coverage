# CLI Reference

## Commands

### `facet generate`

Generate structure files and TypeScript types from facet markdown files.

```bash
# Generate from config (uses facetPattern - recommended)
bunx facet generate

# Generate from specific directory
bunx facet generate <facets-dir>

# Options
bunx facet generate features/checkout/facets/ -o ./custom-output  # Custom output dir
bunx facet generate features/checkout/facets/ -t business         # Override type
bunx facet generate --global                                      # Combined types at project root
bunx facet generate --no-types                                    # Skip TypeScript generation
bunx facet generate --quiet                                       # Suppress ID change warnings
```

**ID Change Detection:** When regenerating, facet warns if IDs have changed (renamed headings, removed sections). This helps catch breaking changes before they affect your tests. Use `--quiet` to suppress these warnings.

**Generated files:**
- `structure.json` - Facet definitions with IDs and source references
- `facets.ts` - TypeScript types for type-safe linking

### `facet analyze`

Run coverage analysis and generate reports.

```bash
# Run coverage analysis
bunx facet analyze

# Options
bunx facet analyze -c facet.config.js    # Custom config
bunx facet analyze -f html               # Specific format
bunx facet analyze -t 80                 # Set threshold
bunx facet analyze --json                # JSON output for CI
bunx facet analyze --silent              # No console output
```

**Output formats:**
- `coverage.json` - Machine-readable coverage data
- `coverage.html` - Visual HTML report
- `coverage.md` - Markdown summary

### `facet validate`

Validate structure files and test links.

```bash
# Validate structure and test links
bunx facet validate

# Options
bunx facet validate --strict    # Require all tests linked
bunx facet validate --json      # JSON output
```

**Checks performed:**
- Source files exist
- Sections exist in source files
- Facet IDs are valid
- Test links reference valid facets

### `facet watch`

Watch for changes and re-run analysis automatically.

```bash
# Re-run on changes
bunx facet watch

# Options
bunx facet watch -v    # Validate before analysis
```

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Coverage below threshold |
| `2` | Validation errors |

## CI/CD Integration

### GitHub Actions

```yaml
- name: Check facet coverage
  run: bunx facet analyze --json

- name: Validate facets
  run: bunx facet validate --strict
```

### Threshold Enforcement

```bash
# Fail CI if coverage is below 80%
bunx facet analyze -t 80

# Fail CI if compliance coverage is not 100%
# (configure in facet.config.js)
bunx facet analyze
```
