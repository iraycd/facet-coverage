# Core Concepts

## What is Facet?

Facet is a coverage framework that tracks whether your tests actually cover what stakeholders need—not just what code executes.

**One feature. Many facets.**

| Perspective | Description |
|-------------|-------------|
| **Business requirements** | Product owner specifications |
| **Compliance mandates** | Regulatory requirements (PCI-DSS, GDPR, etc.) |
| **UX standards** | Design system and accessibility rules |
| **Technical specs** | Architecture and API contracts |

All connected to the same tests. All tracked for coverage.

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Stakeholders   │     │    Developers   │     │  Facet Coverage │
│  write facets   │────▶│  link tests to  │────▶│  tracks what's  │
│  (Markdown)     │     │  facets         │     │  covered        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Stakeholders write requirements** in natural language Markdown files
2. **Facet generates** structure files and TypeScript types
3. **Developers link tests** to facets using `facet()` calls
4. **Facet analyzes** which requirements are covered by tests
5. **Reports show** coverage gaps across all perspectives

## Key Principles

| Principle | Description |
|-----------|-------------|
| **Multi-Perspective** | Every feature has multiple facets from different stakeholders |
| **Natural Language** | Write requirements like humans, not machines |
| **Evolutionary** | Documentation grows with understanding |
| **Traceable** | Exact test-to-facet mapping |
| **Feature-Modular** | Self-contained, team-owned features |
| **Lightweight** | Markdown + JSON, nothing heavy |
| **Flexible** | Adopt incrementally, customize freely |

## Benefits by Role

### For Product Owners
- Write in natural language
- Focus on business value
- See what's tested immediately
- Documentation evolves with product

### For Compliance Teams
- Direct regulation mapping
- Audit-ready traceability
- 100% coverage enforcement
- Automated compliance reports

### For UX Designers
- Document user flows naturally
- Link designs to tests
- Track accessibility coverage
- Mobile/desktop requirements clear

### For Developers
- One test covers multiple facets
- Clear requirements from all stakeholders
- Know exactly what's covered
- Easy maintenance

### For QA Teams
- Complete visibility
- Automated gap detection
- Multi-perspective coverage
- Progress tracking

## The Core Insight

Traditional coverage asks: "What percentage of *code* did tests execute?"

Facet coverage asks: "What percentage of *business requirements* do tests verify?"

When every stakeholder's requirements are documented, linked to tests, and tracked for coverage—that's when you know your product actually does what it's supposed to do, for everyone it's supposed to serve.
