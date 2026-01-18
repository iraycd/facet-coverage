<div align="center">

# Facet Coverage

**Test every facet of your features**

*Write requirements naturally. Know what's tested. Track multi-stakeholder coverage automatically.*

[![npm version](https://img.shields.io/npm/v/@facet-coverage/core.svg)](https://www.npmjs.com/package/@facet-coverage/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CircleCI](https://dl.circleci.com/status-badge/img/gh/iraycd/facet-coverage/tree/main.svg?style=svg)](https://dl.circleci.com/pipelines/gh/iraycd/facet-coverage)
[![Node.js Version](https://img.shields.io/node/v/@facet-coverage/core.svg)](https://nodejs.org)

</div>

---

## Why Facet?

Traditional testing asks "what did developers test?" Facet asks "what do stakeholders need, and is it tested?"

Real products serve multiple stakeholders—product owners, compliance teams, UX designers, security architects—each with their own requirements. Facet lets every stakeholder write requirements in natural language, then tracks whether tests actually cover them.

**One feature. Many facets. All tracked.**

---

## Quick Start

### Install

```bash
bun add -d @facet-coverage/core
```

### 1. Each stakeholder writes their requirements

**Business Team** — `facets/business.md`
```markdown
## Guest Purchase Flow
Users should complete purchases without creating an account.
```

**Compliance Team** — `facets/compliance.md`
```markdown
## PCI-DSS Payment Requirements
1. **Encryption in transit** [](#tls) - TLS 1.2+ required
2. **No CVV storage** [](#cvv) - Never store CVV
3. **Card masking** [](#masking) - Show only last 4 digits
```

**UX Team** — `facets/ux.md`
```markdown
## Mobile Checkout Experience
Large touch targets (44px min), single column layout, inline validation.
```

### 2. Tests link to requirements

```typescript
import { Facets, facet } from '../.facet/facets';

test('guest user completes purchase on mobile', () => {
  // This test proves requirements for 3 different stakeholders
  facet(Facets.BUSINESS_GUEST_PURCHASE_FLOW);
  facet(Facets.COMPLIANCE_PCI_DSS);
  facet(Facets.UX_MOBILE_CHECKOUT_EXPERIENCE);

  const order = checkout(cart, 'user@example.com', '4242424242424242');

  expect(order.confirmed).toBe(true);
  expect(order.maskedCard).toBe('•••• 4242');  // PCI-DSS compliance
});

test('TLS encryption enforced', () => {
  // Track specific compliance sub-requirements
  facet(Facets.COMPLIANCE_PCI_DSS__TLS);

  expect(paymentEndpoint.protocol).toBe('https');
});
```

### 3. See coverage across all perspectives

```bash
bunx facet analyze
```

```
Facet Coverage Report
Overall: 83% (5/6)

  business:   100% (1/1)  ✓
  compliance:  80% (4/5)
    ✗ pci-dss/cvv - No CVV storage
  ux:         100% (1/1)  ✓
```

**Now you know:** The compliance team's CVV requirement isn't tested yet.

---

## Documentation

| Guide | Description |
|-------|-------------|
| [Getting Started](docs/getting-started.md) | Full quickstart with project structure |
| [Core Concepts](docs/concepts.md) | What Facet is and how it works |
| [Configuration](docs/configuration.md) | Config options and examples |
| [CLI Reference](docs/cli.md) | All available commands |
| [Playwright Integration](docs/playwright.md) | Enhanced Playwright support |
| [Programmatic API](docs/api.md) | Use Facet in code |
| [ID Patterns](docs/id-patterns.md) | Stable IDs, sub-facets, and nested features |

### Background

| Document | Description |
|----------|-------------|
| [Vision](docs/vision.md) | Philosophy behind multi-stakeholder coverage |
| [Testing Phases](docs/testing-phases.md) | Where Facet fits in testing |
| [Comparisons](docs/comparisons.md) | How Facet differs from BDD, Cucumber, etc. |

---

## Key Features

- **Natural language** - Write requirements as Markdown, no Gherkin syntax
- **Multi-perspective** - Business, compliance, UX, technical facets per feature
- **Sub-facets** - Track fine-grained requirements with hierarchical IDs
- **Type-safe linking** - Generated TypeScript types prevent broken references
- **Framework agnostic** - Works with Jest, Vitest, Playwright, Mocha, Bun
- **Gap detection** - See what's untested across all stakeholder perspectives
- **Live dashboard** - `facet serve` for real-time coverage with hot reload
- **CI-ready** - Threshold enforcement and JSON output for pipelines

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**[Report Bug](https://github.com/iraycd/facet-coverage/issues) | [Request Feature](https://github.com/iraycd/facet-coverage/issues)**

</div>
