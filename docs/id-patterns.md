# ID Patterns

Facet IDs identify requirements and link them to tests. Understanding ID patterns helps you maintain stable, readable references.

## Auto-Generated IDs (Default)

By default, IDs are generated from the filename and section heading:

```
Pattern: {filename}:{section-slug}

Examples:
- business:guest-purchase-flow
- compliance:pci-dss-payment-requirements
- ux:mobile-checkout-experience
```

The section slug is created by:
1. Converting the heading to lowercase
2. Replacing spaces with hyphens
3. Removing special characters

## Explicit ID Anchors (Recommended)

Use explicit anchors to keep facet IDs stable when headings change:

```markdown
## Guest Purchase Flow {#guest-checkout}

When you rename the heading later, the ID stays the same:

## Complete Guest Checkout Experience {#guest-checkout}
```

This generates `business:guest-checkout` instead of deriving from the heading text.

### Why Use Explicit Anchors?

- **IDs remain stable** when you refactor documentation
- **Tests don't break** when headings are reworded
- **Enables shorter**, more readable IDs

### Syntax

```markdown
## Heading Text {#your-custom-id}
```

The `{#...}` anchor is standard Markdown extended syntax supported by most processors.

## Sub-Facets (Fine-Grained IDs)

When a single section covers multiple testable requirements, use sub-facets for precise tracking:

### List Item IDs

Add `{#id}` to list items for structured checklists:

```markdown
## PCI-DSS Requirements {#pci-dss}

1. **Encryption in transit** {#tls} - TLS 1.2+ required
2. **No CVV storage** {#cvv} - Never store CVV
3. **Card masking** {#masking} - Display only last 4 digits
```

This generates:
- `compliance:pci-dss` (parent)
- `compliance:pci-dss/tls` (sub-facet)
- `compliance:pci-dss/cvv` (sub-facet)
- `compliance:pci-dss/masking` (sub-facet)

### Comment Markers

Use `<!-- @facet:id -->` for hidden markers that keep docs clean:

```markdown
## Mobile Checkout {#mobile}

<!-- @facet:performance -->
Load time must be under 2 seconds.

<!-- @facet:accessibility -->
Full WCAG 2.1 AA compliance required.
```

This generates:
- `ux:mobile` (parent)
- `ux:mobile/performance` (sub-facet)
- `ux:mobile/accessibility` (sub-facet)

### h3+ Headings as Sub-Facets

Configure heading levels to become sub-facets in `facet.config.json`:

```json
{
  "subFacetHeadingLevels": [3]
}
```

Then use h3 headings with explicit IDs:

```markdown
## Mobile Checkout {#mobile-checkout}

### Layout Requirements {#responsive}
- Large touch targets (44px minimum)

### Accessibility {#accessibility}
- Full keyboard navigation
```

This generates:
- `ux:mobile-checkout` (parent h2)
- `ux:mobile-checkout/responsive` (sub-facet from h3)
- `ux:mobile-checkout/accessibility` (sub-facet from h3)

### Using Sub-Facets in Tests

Sub-facet constants use double underscore (`__`) as the separator:

```typescript
import { Facets, facet } from '../.facet/facets';

test('TLS 1.2 is enforced', () => {
  facet(Facets.COMPLIANCE_PCI_DSS__TLS);  // Maps to compliance:pci-dss/tls
  expect(response.tls).toBe('1.2+');
});

test('page loads under 2 seconds', () => {
  facet(Facets.UX_MOBILE__PERFORMANCE);  // Maps to ux:mobile/performance
  expect(loadTime).toBeLessThan(2000);
});
```

### When to Use Sub-Facets

- **Use list item IDs** for structured checklists where IDs are part of the documentation
- **Use comment markers** for prose where visible IDs would disrupt readability
- **Use h3+ headings** when you have natural document structure with subsections

## Nested Features (Hierarchical IDs)

For complex projects, organize features in nested directories:

```
features/
├── checkout/
│   ├── payments/
│   │   ├── facets/
│   │   │   └── compliance.md
│   │   └── .facet/
│   │       └── structure.json
```

This generates hierarchical IDs:

```
checkout/payments/compliance:pci-dss-requirements
```

Use in tests:

```typescript
facet(Facets.CHECKOUT_PAYMENTS_COMPLIANCE_PCI_DSS_REQUIREMENTS);
```

## Flexible Linking

All three formats work when linking tests to facets:

```typescript
// Custom slug (from explicit anchor)
facet('guest-checkout-flow')

// Auto-generated (filename:section-slug)
facet('business:guest-purchase-flow')

// Direct path reference
facet('facets/business.md#guest-purchase-flow')
```

## ID Change Detection

When regenerating structure files, Facet warns if IDs have changed:

```bash
bunx facet generate

# Warning: ID changed
#   Old: business:guest-purchase-flow
#   New: business:complete-guest-checkout-experience
# Tests referencing the old ID will break.
```

To suppress warnings (e.g., when intentionally renaming):

```bash
bunx facet generate --quiet
```

## Best Practices

1. **Use explicit anchors** for important facets that tests link to
2. **Keep IDs short** but descriptive: `guest-checkout` not `the-guest-checkout-flow-for-users`
3. **Use consistent naming** across your team
4. **Review ID changes** before merging—they break test links
