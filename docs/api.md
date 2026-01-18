# Programmatic API

Use the Facet Coverage API directly in your code for custom integrations.

## Basic Usage

```typescript
import {
  StructureReader,
  TestScanner,
  CoverageCalculator,
  Validator,
  JsonReporter,
  HtmlReporter,
  MarkdownReporter
} from '@facet-coverage/core';

// Read structures
const reader = new StructureReader();
const structures = await reader.readAllStructures();

// Scan tests
const scanner = new TestScanner();
const tests = await scanner.scanAllTests();

// Calculate coverage
const calculator = new CoverageCalculator();
const report = await calculator.calculateCoverage();

// Validate
const validator = new Validator();
const result = await validator.validate();

// Generate reports
const jsonReporter = new JsonReporter();
jsonReporter.write(report);

const htmlReporter = new HtmlReporter();
htmlReporter.write(report);

const mdReporter = new MarkdownReporter();
mdReporter.write(report);
```

## Classes

### StructureReader

Reads and parses facet structure files.

```typescript
const reader = new StructureReader();

// Read all structures matching config patterns
const structures = await reader.readAllStructures();

// Read specific structure file
const structure = await reader.readStructure('features/checkout/.facet/structure.json');
```

### TestScanner

Scans test files for facet links.

```typescript
const scanner = new TestScanner();

// Scan all tests matching config patterns
const tests = await scanner.scanAllTests();

// Scan specific directory
const tests = await scanner.scanTests('features/checkout/tests');
```

### CoverageCalculator

Calculates coverage from structures and test links.

```typescript
const calculator = new CoverageCalculator();

// Calculate full coverage report
const report = await calculator.calculateCoverage();

// Report structure
// {
//   overall: { covered: 10, total: 12, percentage: 83.33 },
//   byType: {
//     business: { covered: 5, total: 6, percentage: 83.33 },
//     compliance: { covered: 5, total: 6, percentage: 83.33 }
//   },
//   facets: [
//     { id: 'business:checkout', covered: true, tests: ['checkout.spec.ts'] },
//     { id: 'compliance:pci-dss', covered: false, tests: [] }
//   ]
// }
```

### Validator

Validates structure files and test links.

```typescript
const validator = new Validator();

// Run validation
const result = await validator.validate();

// Result structure
// {
//   valid: false,
//   errors: [
//     { type: 'missing-source', facetId: 'business:old-feature', message: '...' }
//   ],
//   warnings: [
//     { type: 'unlinked-test', file: 'orphan.spec.ts', message: '...' }
//   ]
// }
```

### Reporters

Generate coverage reports in various formats.

```typescript
import { JsonReporter, HtmlReporter, MarkdownReporter } from '@facet-coverage/core';

const report = await calculator.calculateCoverage();

// JSON report
const jsonReporter = new JsonReporter({ outputDir: '.facet-coverage' });
await jsonReporter.write(report);

// HTML report
const htmlReporter = new HtmlReporter({ outputDir: '.facet-coverage' });
await htmlReporter.write(report);

// Markdown report
const mdReporter = new MarkdownReporter({ outputDir: '.facet-coverage' });
await mdReporter.write(report);
```

## Custom Integration Example

```typescript
import { CoverageCalculator } from '@facet-coverage/core';

async function checkCoverageInCI() {
  const calculator = new CoverageCalculator();
  const report = await calculator.calculateCoverage();

  // Check overall threshold
  if (report.overall.percentage < 80) {
    console.error(`Coverage ${report.overall.percentage}% is below 80% threshold`);
    process.exit(1);
  }

  // Check compliance must be 100%
  if (report.byType.compliance?.percentage < 100) {
    console.error('Compliance coverage must be 100%');
    process.exit(1);
  }

  // List uncovered facets
  const uncovered = report.facets.filter(f => !f.covered);
  if (uncovered.length > 0) {
    console.log('Uncovered facets:');
    uncovered.forEach(f => console.log(`  - ${f.id}`));
  }

  console.log(`Coverage: ${report.overall.percentage}%`);
}
```
