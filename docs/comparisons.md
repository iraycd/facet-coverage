# How Facet Differs

## Facet vs Other Testing Approaches

| Approach | Focus | Facet's Difference |
|----------|-------|-------------------|
| **TDD** | Code correctness via unit tests | Facet tracks *what* is covered, not *how* to write code |
| **BDD** | Behavior via Given-When-Then | Facet uses free-form natural language, not structured syntax |
| **ATDD** | Acceptance criteria drive development | Facet maps multiple perspectives to tests, not just acceptance |
| **Traditional Coverage** | Lines/branches executed | Facet measures *requirement* coverage, not code coverage |

**Key insight:** TDD/BDD/ATDD are *development methodologies*. Facet is a *coverage framework*. Use them together.

## Facet vs Cucumber (and Similar BDD Tools)

Cucumber, SpecFlow, Behave, and similar tools follow a **specification-as-test** architecture where `.feature` files written in Gherkin syntax are directly executed as tests. Facet takes a fundamentally different approach: **specification-as-documentation**.

| Aspect | Cucumber / BDD Tools | Facet |
|--------|---------------------|-------|
| **Syntax** | Gherkin (Given-When-Then) | Free-form Markdown |
| **Specifications** | Are the tests (executable) | Are documentation (linked to tests) |
| **Step definitions** | Required for each step | Not needed - tests are regular code |
| **Learning curve** | Must learn Gherkin syntax | Write in natural language |
| **Perspectives** | Single specification file | Multiple facets per feature |
| **Test framework** | Cucumber runner | Any framework (Jest, Vitest, Playwright, etc.) |
| **Maintenance** | Step definitions can drift from specs | Direct linking prevents drift |

### Architectural Difference

**Cucumber Approach:**
```
Feature file (Gherkin) → Step definitions (glue code) → Test runner (Cucumber)
```

**Facet Approach:**
```
Facet files (Markdown) ←→ Your tests (any runner)
         ↓
   Coverage report
```

### Why This Matters

1. **No translation layer** - Cucumber requires step definitions that translate Gherkin to code. These become a maintenance burden and can drift from specs. Facet links directly to existing tests.

2. **Use your existing tests** - With Cucumber, you rewrite tests in Gherkin. With Facet, you add `facet()` calls to tests you already have.

3. **Multiple perspectives** - A Cucumber feature file is one perspective. Facet lets business, compliance, UX, and technical teams each write their own facets for the same feature.

4. **Natural language freedom** - Gherkin's structured syntax (`Given`/`When`/`Then`) forces a specific format. Facet accepts any prose—bullet points, paragraphs, tables—whatever communicates best.

5. **Framework agnostic** - Cucumber requires the Cucumber test runner. Facet works with Jest, Vitest, Mocha, Playwright, or any testing framework.

### When to Use Which

- **Cucumber**: When you want executable specifications and your team has invested in the Gherkin ecosystem
- **Facet**: When you want coverage tracking across multiple perspectives without changing how you write tests

## Why Facet Works for AI-Driven Testing

AI coding assistants excel at generating tests but struggle with *what to test*. Facet solves this:

- **Natural language specs** - AI understands requirements without parsing Gherkin
- **Multi-perspective facets** - AI generates tests covering business, compliance, UX in one pass
- **Type-safe linking** - AI can programmatically verify coverage completeness
- **Gap detection** - AI identifies untested facets and generates missing tests

```
Human: "Generate tests for checkout"
         ↓
AI reads facets → Understands business rules, PCI compliance, UX requirements
         ↓
Generates comprehensive tests → Links to facets automatically
```

Facet bridges human intent and AI execution with traceable, verifiable coverage.
