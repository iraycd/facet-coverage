# Where Facet Fits in Testing

Facet Coverage isn't a *type* of testing—it's a **requirements traceability layer** that sits on top of your existing tests. It spans testing phases rather than belonging to one.

## Where Facet Shines

### Acceptance/Feature Testing

This is the sweet spot. Facets are stakeholder requirements, and acceptance tests verify those requirements. The mapping is natural.

```typescript
// This test directly maps to business requirements
test('guest user can complete a purchase', () => {
  facet(Facets.BUSINESS_GUEST_CHECKOUT);
  facet(Facets.COMPLIANCE_PCI_DSS);
  // ...
});
```

### Integration/E2E Testing

Tests that exercise user flows and system behavior map well to business requirements like "user can checkout with saved payment method" or "PII is encrypted in transit."

### Compliance Audits

When an auditor asks "prove HIPAA requirement X is tested," you can point to specific tests linked to that facet. The coverage report provides audit-ready traceability.

### Gap Analysis

Before release, you can see which stakeholder requirements have no test coverage at all—across business, compliance, UX, and technical perspectives simultaneously.

## Where Facet is Less Useful

### Unit Testing

Most unit tests verify implementation details (`doesThisFunctionSortCorrectly`) not business requirements. You *could* link some unit tests to facets, but it's often too granular to be meaningful.

### Exploratory Testing

Exploratory testing is unscripted by nature and doesn't map well to predefined requirements.

### Performance/Load Testing

These tests verify system characteristics, not feature requirements. However, you could have a "performance budget" facet for specific thresholds if performance is a documented requirement.

## The Mental Model

Think of Facet as a layer that answers a different question:

| Approach | Question Answered |
|----------|-------------------|
| **Code coverage** | "What % of *code* did tests execute?" |
| **Facet coverage** | "What % of *business requirements* do tests verify?" |

## When to Use Facet

Facet is most valuable when:

1. **Multiple stakeholders** have requirements (product, compliance, security, UX)
2. **Traceability matters** (regulated industries, audits)
3. **You need to prove** specific requirements are tested
4. **Gap detection** is important before releases

Facet adds the most value at the acceptance/integration level where tests naturally align with stakeholder requirements.
