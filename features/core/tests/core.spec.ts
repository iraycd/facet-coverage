import { test, expect, describe, beforeAll } from 'bun:test';
import { StructureReader } from '../../../src/core/StructureReader.js';
import { FacetParser } from '../../../src/core/FacetParser.js';
import { TestScanner } from '../../../src/core/TestScanner.js';
import { Validator } from '../../../src/core/Validator.js';
import { CoverageCalculator } from '../../../src/core/CoverageCalculator.js';
import { IDChangeDetector } from '../../../src/core/IDChangeDetector.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { Facets, facet } from '../.facet/facets';

const testDir = join(import.meta.dir, '../../../.test-fixtures');

describe('StructureReader', () => {
  beforeAll(() => {
    // Create test fixtures
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(join(testDir, 'feature1/.facet'), { recursive: true });
    mkdirSync(join(testDir, 'feature1/facets'), { recursive: true });

    writeFileSync(join(testDir, 'feature1/.facet/structure.json'), JSON.stringify({
      feature: 'feature1',
      facets: [
        { id: 'test:facet-one', source: { file: 'facets/test.md', section: 'facet-one' }, type: 'test', title: 'Facet One' }
      ]
    }));

    writeFileSync(join(testDir, 'feature1/facets/test.md'), '# Test\n\n## Facet One\n\nContent here.');
  });

  test('finds structure files via glob patterns', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING__GLOB_PATTERNS);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const files = await reader.findStructureFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('feature1'))).toBe(true);
  });

  test('parses structure.json with validation', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING__JSON_PARSING);

    const reader = new StructureReader();
    const structure = await reader.readStructure(join(testDir, 'feature1/.facet/structure.json'));
    expect(structure.feature).toBe('feature1');
    expect(structure.facets.length).toBe(1);
    expect(structure.facets[0].id).toBe('test:facet-one');
  });

  test('returns all facets across structures', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING__FACET_AGGREGATION);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const facets = await reader.getAllFacets(join(import.meta.dir, '../../..'));
    expect(facets.length).toBeGreaterThan(0);
  });
});

describe('FacetParser', () => {
  test('extracts headings as sections', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__HEADING_EXTRACTION);

    const parser = new FacetParser();
    const parsed = await parser.parseFile(join(testDir, 'feature1/facets/test.md'));
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.sections.some(s => s.slug === 'facet-one')).toBe(true);
  });

  test('generates URL-friendly slugs', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__SLUG_GENERATION);

    expect(FacetParser.slugify('Hello World')).toBe('hello-world');
    expect(FacetParser.slugify('PCI-DSS Requirements')).toBe('pci-dss-requirements');
    expect(FacetParser.slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
  });

  test('validates section existence', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__SECTION_VALIDATION);

    const parser = new FacetParser();
    const exists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'facet-one');
    expect(exists).toBe(true);
    const notExists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'nonexistent');
    expect(notExists).toBe(false);
  });

  test('supports explicit anchor syntax [](#custom-id)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__CUSTOM_SLUG);

    const parser = new FacetParser();
    const content = `# Main Title

## Guest Purchase Flow
[](#guest-purchase)

Content here.

## Another Section

More content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    // Section with explicit anchor should use custom slug
    const guestSection = parsed.sections.find(s => s.title === 'Guest Purchase Flow');
    expect(guestSection).toBeDefined();
    expect(guestSection!.slug).toBe('guest-purchase');

    // Section without explicit anchor should use auto-generated slug
    const anotherSection = parsed.sections.find(s => s.title === 'Another Section');
    expect(anotherSection).toBeDefined();
    expect(anotherSection!.slug).toBe('another-section');
  });

  test('explicit anchors work at all heading levels', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__HEADING_HIERARCHY);

    const parser = new FacetParser();
    const content = `# H1
[](#h1-anchor)

## H2
[](#h2-anchor)

### H3
[](#h3-anchor)

#### H4
[](#h4-anchor)

##### H5
[](#h5-anchor)

###### H6
[](#h6-anchor)
`;
    const parsed = parser.parseContent(content, 'test.md');

    expect(parsed.sections.find(s => s.slug === 'h1-anchor')).toBeDefined();
    expect(parsed.sections.find(s => s.slug === 'h2-anchor')).toBeDefined();
    expect(parsed.sections.find(s => s.slug === 'h3-anchor')).toBeDefined();
    expect(parsed.sections.find(s => s.slug === 'h4-anchor')).toBeDefined();
    expect(parsed.sections.find(s => s.slug === 'h5-anchor')).toBeDefined();
    expect(parsed.sections.find(s => s.slug === 'h6-anchor')).toBeDefined();
  });

  test('explicit anchor overrides auto-generated slug', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__CUSTOM_SLUG);

    const parser = new FacetParser();
    const content = `## Very Long Heading That Would Make A Long Slug
[](#short)

Content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    const section = parsed.sections[0];
    expect(section.title).toBe('Very Long Heading That Would Make A Long Slug');
    expect(section.slug).toBe('short');
  });

  test('preserves heading title when using explicit anchor', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING__CUSTOM_SLUG);

    const parser = new FacetParser();
    const content = `## Guest Purchase Flow
[](#guest-purchase)

Content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    const section = parsed.sections[0];
    expect(section.title).toBe('Guest Purchase Flow');
    expect(section.slug).toBe('guest-purchase');
  });

  test('parses sub-facets from list items with [](#id)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## PCI-DSS Requirements
[](#pci-dss)

1. **Encryption in transit** [](#tls) - TLS 1.2+ required
2. **No CVV storage** [](#cvv) - Never store CVV
3. **Card masking** [](#masking) - Display only last 4 digits
`;
    const parsed = parser.parseContent(content, 'compliance.md');

    const section = parsed.sections[0];
    expect(section.slug).toBe('pci-dss');
    expect(section.subFacets).toBeDefined();
    expect(section.subFacets!.length).toBe(3);

    expect(section.subFacets![0].id).toBe('tls');
    expect(section.subFacets![0].type).toBe('link');

    expect(section.subFacets![1].id).toBe('cvv');
    expect(section.subFacets![1].type).toBe('link');

    expect(section.subFacets![2].id).toBe('masking');
    expect(section.subFacets![2].type).toBe('link');
  });

  test('parses sub-facets from comment markers', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## Mobile Checkout
[](#mobile)

<!-- @facet:performance -->
Load time must be under 2 seconds.

<!-- @facet:accessibility -->
Full WCAG 2.1 AA compliance required.
`;
    const parsed = parser.parseContent(content, 'ux.md');

    const section = parsed.sections[0];
    expect(section.slug).toBe('mobile');
    expect(section.subFacets).toBeDefined();
    expect(section.subFacets!.length).toBe(2);

    expect(section.subFacets![0].id).toBe('performance');
    expect(section.subFacets![0].type).toBe('comment');

    expect(section.subFacets![1].id).toBe('accessibility');
    expect(section.subFacets![1].type).toBe('comment');
  });

  test('parses sub-facets from empty link anchors [](#id)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## Business Requirements
[](#business)

[](#revenue-tracking)
Track all revenue-generating events.

[](#user-retention)
Monitor user retention metrics.
`;
    const parsed = parser.parseContent(content, 'business.md');

    const section = parsed.sections[0];
    expect(section.slug).toBe('business');
    expect(section.subFacets).toBeDefined();
    // Note: first [](#business) is used for heading ID, remaining two are sub-facets
    expect(section.subFacets!.length).toBe(2);

    expect(section.subFacets![0].id).toBe('revenue-tracking');
    expect(section.subFacets![0].type).toBe('link');

    expect(section.subFacets![1].id).toBe('user-retention');
    expect(section.subFacets![1].type).toBe('link');
  });

  test('parses mixed sub-facet patterns (comment and link)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## Requirements
[](#reqs)

- Item one [](#item-one)
- Item two [](#item-two)

<!-- @facet:extra -->
Additional requirement.

[](#clean-marker)
This uses the clean link syntax.
`;
    const parsed = parser.parseContent(content, 'test.md');

    const section = parsed.sections[0];
    expect(section.slug).toBe('reqs');
    expect(section.subFacets!.length).toBe(4);
    expect(section.subFacets![0].type).toBe('link');
    expect(section.subFacets![0].id).toBe('item-one');
    expect(section.subFacets![1].type).toBe('link');
    expect(section.subFacets![1].id).toBe('item-two');
    expect(section.subFacets![2].type).toBe('comment');
    expect(section.subFacets![2].id).toBe('extra');
    expect(section.subFacets![3].type).toBe('link');
    expect(section.subFacets![3].id).toBe('clean-marker');
  });

  test('generates hierarchical sub-facet IDs', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parentId = 'compliance:pci-dss';
    const subFacetId = FacetParser.generateSubFacetId(parentId, 'tls');
    expect(subFacetId).toBe('compliance:pci-dss/tls');
  });

  test('identifies sub-facet IDs', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    expect(FacetParser.isSubFacetId('compliance:pci-dss/tls')).toBe(true);
    expect(FacetParser.isSubFacetId('compliance:pci-dss')).toBe(false);
    expect(FacetParser.isSubFacetId('features/cli/product:generate-command')).toBe(false);
  });

  test('extracts parent facet ID from sub-facet', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    expect(FacetParser.getParentFacetId('compliance:pci-dss/tls')).toBe('compliance:pci-dss');
    expect(FacetParser.getParentFacetId('compliance:pci-dss')).toBeNull();
  });
});

describe('TestScanner', () => {
  beforeAll(() => {
    mkdirSync(join(testDir, 'tests'), { recursive: true });
    writeFileSync(join(testDir, 'tests/example.spec.ts'), `
import { test } from 'bun:test';

describe('Example', () => {
  // @facet test:facet-one
  test('test with comment annotation', () => {
    expect(true).toBe(true);
  });
});
`);
  });

  test('finds test files matching patterns', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING__TEST_FILE_DISCOVERY);

    const scanner = new TestScanner({
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const files = await scanner.findTestFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
  });

  test('supports comment-based annotations', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING__COMMENT_ANNOTATIONS);

    const scanner = new TestScanner();
    const content = `
describe('Test', () => {
  // @facet product:feature-a, product:feature-b
  test('my test', () => {});
});
`;
    const links = scanner.scanContent(content, 'test.spec.ts', '/');
    expect(links.length).toBe(1);
    expect(links[0].facetIds).toContain('product:feature-a');
    expect(links[0].facetIds).toContain('product:feature-b');
  });

  test('supports Playwright-style annotations', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING__PLAYWRIGHT_ANNOTATIONS);

    const scanner = new TestScanner();
    const content = `
test('my test', {
  annotation: facet('product:feature-a')
}, () => {});
`;
    const links = scanner.scanContent(content, 'test.spec.ts', '/');
    expect(links.length).toBe(1);
    expect(links[0].facetIds).toContain('product:feature-a');
  });

  test('tracks describe block nesting', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING__DESCRIBE_NESTING);

    const scanner = new TestScanner();
    const content = `
describe('Outer', () => {
  describe('Inner', () => {
    // @facet test:nested
    test('nested test', () => {});
  });
});
`;
    const links = scanner.scanContent(content, 'test.spec.ts', '/');
    expect(links.length).toBe(1);
    expect(links[0].fullTitle).toBe('Outer > Inner > nested test');
  });

  test('handles sub-facet constants with double underscore', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner({
      facetTypes: ['compliance', 'business', 'ux']
    });
    const content = `
test('TLS enforcement test', () => {
  facet(Facets.COMPLIANCE_PCI_DSS__TLS);
});
`;
    const links = scanner.scanContent(content, 'test.spec.ts', '/');
    expect(links.length).toBe(1);
    expect(links[0].facetIds).toContain('compliance:pci-dss/tls');
  });

  test('handles regular facet constants alongside sub-facet constants', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner({
      facetTypes: ['compliance', 'business', 'ux']
    });
    const content = `
test('payment test', () => {
  facet(Facets.COMPLIANCE_PCI_DSS);
  facet(Facets.COMPLIANCE_PCI_DSS__CVV);
});
`;
    const links = scanner.scanContent(content, 'test.spec.ts', '/');
    expect(links.length).toBe(1);
    expect(links[0].facetIds).toContain('compliance:pci-dss');
    expect(links[0].facetIds).toContain('compliance:pci-dss/cvv');
  });
});

describe('Validator', () => {
  test('detects missing source files', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const validator = new Validator({
      structureFiles: ['.test-fixtures/**/.facet/structure.json'],
      validation: { requireSourceExists: true, requireSectionExists: true, requireAllTestsLinked: false }
    });

    // Create a structure with missing source
    mkdirSync(join(testDir, 'feature2/.facet'), { recursive: true });
    writeFileSync(join(testDir, 'feature2/.facet/structure.json'), JSON.stringify({
      feature: 'feature2',
      facets: [
        { id: 'test:missing', source: { file: 'nonexistent.md', section: 'missing' }, type: 'test', title: 'Missing' }
      ]
    }));

    const result = await validator.validateStructure(
      { feature: 'feature2', facets: [{ id: 'test:missing', source: { file: 'nonexistent.md', section: 'missing' }, type: 'test', title: 'Missing' }] },
      join(testDir, 'feature2/.facet/structure.json')
    );
    expect(result.errors.some(e => e.message.includes('not found'))).toBe(true);
  });

  test('returns structured errors and warnings', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const validator = new Validator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts'],
      validation: { requireSourceExists: true, requireSectionExists: true, requireAllTestsLinked: false }
    });
    const result = await validator.validate(join(import.meta.dir, '../../..'));
    expect(result).toHaveProperty('errors');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.errors)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
  });
});

describe('CoverageCalculator', () => {
  test('calculates overall coverage percentage', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_COVERAGE_CALCULATION);

    const calculator = new CoverageCalculator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const report = await calculator.calculateCoverage(join(import.meta.dir, '../../..'));
    expect(report).toHaveProperty('summary');
    expect(report.summary).toHaveProperty('percentage');
    expect(typeof report.summary.percentage).toBe('number');
  });

  test('calculates coverage by type', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_COVERAGE_CALCULATION);

    const calculator = new CoverageCalculator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const report = await calculator.calculateCoverage(join(import.meta.dir, '../../..'));
    expect(report).toHaveProperty('byType');
    expect(Array.isArray(report.byType)).toBe(true);
  });

  test('returns comprehensive coverage report', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_COVERAGE_CALCULATION);

    const calculator = new CoverageCalculator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const report = await calculator.calculateCoverage(join(import.meta.dir, '../../..'));
    expect(report).toHaveProperty('features');
    expect(report).toHaveProperty('uncovered');
    expect(report).toHaveProperty('tests');
  });
});

describe('Error Handling', () => {
  test('provides clear error messages for missing files', async () => {
    facet(Facets.FEATURES_CORE_DX_ERROR_MESSAGES);

    const reader = new StructureReader();
    try {
      await reader.readStructure('/nonexistent/path/structure.json');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect((error as Error).message).toContain('not found');
    }
  });
});

describe('TypeScript Support', () => {
  test('exports type definitions', async () => {
    facet(Facets.FEATURES_CORE_TECHNICAL_TYPESCRIPT_SUPPORT);

    const { Facet, FacetConfig, CoverageReport } = await import('../../../src/types.js');
    // These imports should succeed if types are properly exported
    expect(true).toBe(true);
  });
});

describe('Unlinked Tests Tracking', () => {
  test('scanContentWithUnlinked returns both linked and unlinked tests', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner();
    const content = `
describe('Example', () => {
  // @facet product:feature-a
  test('linked test', () => {});

  test('unlinked test without annotations', () => {});
});
`;
    const result = scanner.scanContentWithUnlinked(content, 'test.spec.ts', '/');

    expect(result.linkedTests.length).toBe(1);
    expect(result.linkedTests[0].title).toBe('linked test');
    expect(result.linkedTests[0].facetIds).toContain('product:feature-a');

    expect(result.unlinkedTests.length).toBe(1);
    expect(result.unlinkedTests[0].title).toBe('unlinked test without annotations');
  });

  test('tests with facet() calls inside body are linked, not unlinked', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner({
      facetTypes: ['product', 'compliance']
    });
    const content = `
test('test with facet call inside', () => {
  facet(Facets.PRODUCT_FEATURE);
});

test('test without any facet', () => {
  expect(true).toBe(true);
});
`;
    const result = scanner.scanContentWithUnlinked(content, 'test.spec.ts', '/');

    expect(result.linkedTests.length).toBe(1);
    expect(result.linkedTests[0].title).toBe('test with facet call inside');

    expect(result.unlinkedTests.length).toBe(1);
    expect(result.unlinkedTests[0].title).toBe('test without any facet');
  });

  test('unlinked tests include file, title, fullTitle, and line', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner();
    const content = `
describe('Suite', () => {
  test('unlinked test', () => {});
});
`;
    const result = scanner.scanContentWithUnlinked(content, '/path/to/test.spec.ts', '/path/to');

    expect(result.unlinkedTests.length).toBe(1);
    const unlinked = result.unlinkedTests[0];
    expect(unlinked.file).toBe('test.spec.ts');
    expect(unlinked.title).toBe('unlinked test');
    expect(unlinked.fullTitle).toBe('Suite > unlinked test');
    expect(unlinked.line).toBeDefined();
  });

  test('CoverageReport includes unlinkedTests array', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_COVERAGE_CALCULATION);

    const calculator = new CoverageCalculator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const report = await calculator.calculateCoverage(join(import.meta.dir, '../../..'));

    expect(report).toHaveProperty('unlinkedTests');
    expect(Array.isArray(report.unlinkedTests)).toBe(true);
  });
});

describe('IDChangeDetector', () => {
  const changeTestDir = join(testDir, 'id-changes');

  beforeAll(() => {
    mkdirSync(changeTestDir, { recursive: true });
  });

  test('detects no changes when structure file does not exist', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const newFacets = [
      { id: 'product:feature-one', source: { file: 'product.md', section: 'feature-one' }, type: 'product', title: 'Feature One' }
    ];

    const report = IDChangeDetector.detectChanges('/nonexistent/structure.json', newFacets);

    expect(report.hasChanges).toBe(false);
    expect(report.added.length).toBe(0);
    expect(report.removed.length).toBe(0);
    expect(report.renamed.length).toBe(0);
  });

  test('detects added facets', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const existingPath = join(changeTestDir, 'added-test.json');
    writeFileSync(existingPath, JSON.stringify({
      feature: 'test',
      facets: [
        { id: 'product:existing', source: { file: 'product.md', section: 'existing' }, type: 'product', title: 'Existing' }
      ]
    }));

    const newFacets = [
      { id: 'product:existing', source: { file: 'product.md', section: 'existing' }, type: 'product', title: 'Existing' },
      { id: 'product:new-feature', source: { file: 'product.md', section: 'new-feature' }, type: 'product', title: 'New Feature' }
    ];

    const report = IDChangeDetector.detectChanges(existingPath, newFacets);

    expect(report.hasChanges).toBe(true);
    expect(report.added.length).toBe(1);
    expect(report.added[0].newId).toBe('product:new-feature');
    expect(report.removed.length).toBe(0);
    expect(report.renamed.length).toBe(0);
  });

  test('detects removed facets', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const existingPath = join(changeTestDir, 'removed-test.json');
    writeFileSync(existingPath, JSON.stringify({
      feature: 'test',
      facets: [
        { id: 'product:feature-one', source: { file: 'product.md', section: 'feature-one' }, type: 'product', title: 'Feature One' },
        { id: 'product:feature-two', source: { file: 'product.md', section: 'feature-two' }, type: 'product', title: 'Feature Two' }
      ]
    }));

    const newFacets = [
      { id: 'product:feature-one', source: { file: 'product.md', section: 'feature-one' }, type: 'product', title: 'Feature One' }
    ];

    const report = IDChangeDetector.detectChanges(existingPath, newFacets);

    expect(report.hasChanges).toBe(true);
    expect(report.removed.length).toBe(1);
    expect(report.removed[0].oldId).toBe('product:feature-two');
    expect(report.added.length).toBe(0);
    expect(report.renamed.length).toBe(0);
  });

  test('detects renamed facets (same source, different ID)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const existingPath = join(changeTestDir, 'renamed-test.json');
    writeFileSync(existingPath, JSON.stringify({
      feature: 'test',
      facets: [
        { id: 'product:old-feature-name', source: { file: 'product.md', section: 'feature' }, type: 'product', title: 'Old Feature Name' }
      ]
    }));

    // Same source location but different ID (heading text changed)
    const newFacets = [
      { id: 'product:new-feature-name', source: { file: 'product.md', section: 'feature' }, type: 'product', title: 'New Feature Name' }
    ];

    const report = IDChangeDetector.detectChanges(existingPath, newFacets);

    expect(report.hasChanges).toBe(true);
    expect(report.renamed.length).toBe(1);
    expect(report.renamed[0].oldId).toBe('product:old-feature-name');
    expect(report.renamed[0].newId).toBe('product:new-feature-name');
    expect(report.added.length).toBe(0);
    expect(report.removed.length).toBe(0);
  });

  test('formats change report correctly', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const report = {
      hasChanges: true,
      added: [{ type: 'added' as const, newId: 'product:new', file: 'product.md', section: 'new', title: 'New' }],
      removed: [{ type: 'removed' as const, oldId: 'product:old', file: 'product.md', section: 'old', title: 'Old' }],
      renamed: [{ type: 'renamed' as const, oldId: 'product:before', newId: 'product:after', file: 'product.md', section: 'section', title: 'After' }]
    };

    const lines = IDChangeDetector.formatReport(report);

    expect(lines.some(l => l.includes('Renamed'))).toBe(true);
    expect(lines.some(l => l.includes('product:before'))).toBe(true);
    expect(lines.some(l => l.includes('product:after'))).toBe(true);
    expect(lines.some(l => l.includes('Removed'))).toBe(true);
    expect(lines.some(l => l.includes('product:old'))).toBe(true);
    expect(lines.some(l => l.includes('Added'))).toBe(true);
    expect(lines.some(l => l.includes('product:new'))).toBe(true);
  });

  test('handles empty change report', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const report = {
      hasChanges: false,
      added: [],
      removed: [],
      renamed: []
    };

    const lines = IDChangeDetector.formatReport(report);
    expect(lines.length).toBe(0);
  });

  test('detects complex changes (add, remove, rename in one pass)', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_VALIDATION);

    const existingPath = join(changeTestDir, 'complex-test.json');
    writeFileSync(existingPath, JSON.stringify({
      feature: 'test',
      facets: [
        { id: 'product:keep', source: { file: 'product.md', section: 'keep' }, type: 'product', title: 'Keep' },
        { id: 'product:remove-me', source: { file: 'product.md', section: 'remove-me' }, type: 'product', title: 'Remove Me' },
        { id: 'product:old-name', source: { file: 'product.md', section: 'rename-section' }, type: 'product', title: 'Old Name' }
      ]
    }));

    const newFacets = [
      { id: 'product:keep', source: { file: 'product.md', section: 'keep' }, type: 'product', title: 'Keep' },
      { id: 'product:new-name', source: { file: 'product.md', section: 'rename-section' }, type: 'product', title: 'New Name' },
      { id: 'product:brand-new', source: { file: 'product.md', section: 'brand-new' }, type: 'product', title: 'Brand New' }
    ];

    const report = IDChangeDetector.detectChanges(existingPath, newFacets);

    expect(report.hasChanges).toBe(true);
    expect(report.added.length).toBe(1);
    expect(report.removed.length).toBe(1);
    expect(report.renamed.length).toBe(1);
    expect(report.added[0].newId).toBe('product:brand-new');
    expect(report.removed[0].oldId).toBe('product:remove-me');
    expect(report.renamed[0].oldId).toBe('product:old-name');
    expect(report.renamed[0].newId).toBe('product:new-name');
  });
});
