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
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const files = await reader.findStructureFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('feature1'))).toBe(true);
  });

  test('parses structure.json with validation', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader();
    const structure = await reader.readStructure(join(testDir, 'feature1/.facet/structure.json'));
    expect(structure.feature).toBe('feature1');
    expect(structure.facets.length).toBe(1);
    expect(structure.facets[0].id).toBe('test:facet-one');
  });

  test('returns all facets across structures', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const facets = await reader.getAllFacets(join(import.meta.dir, '../../..'));
    expect(facets.length).toBeGreaterThan(0);
  });
});

describe('FacetParser', () => {
  test('extracts headings as sections', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const parsed = await parser.parseFile(join(testDir, 'feature1/facets/test.md'));
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.sections.some(s => s.slug === 'facet-one')).toBe(true);
  });

  test('generates URL-friendly slugs', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    expect(FacetParser.slugify('Hello World')).toBe('hello-world');
    expect(FacetParser.slugify('PCI-DSS Requirements')).toBe('pci-dss-requirements');
    expect(FacetParser.slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
  });

  test('validates section existence', async () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const exists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'facet-one');
    expect(exists).toBe(true);
    const notExists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'nonexistent');
    expect(notExists).toBe(false);
  });

  test('supports explicit anchor syntax {#custom-id}', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `# Main Title

## Guest Purchase Flow {#guest-purchase}

Content here.

## Another Section

More content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    // Section with explicit anchor should use custom slug
    const guestSection = parsed.sections.find(s => s.title === 'Guest Purchase Flow');
    expect(guestSection).toBeDefined();
    expect(guestSection!.slug).toBe('guest-purchase');
    expect(guestSection!.explicitId).toBe('guest-purchase');

    // Section without explicit anchor should use auto-generated slug
    const anotherSection = parsed.sections.find(s => s.title === 'Another Section');
    expect(anotherSection).toBeDefined();
    expect(anotherSection!.slug).toBe('another-section');
    expect(anotherSection!.explicitId).toBeUndefined();
  });

  test('explicit anchors work at all heading levels', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `# H1 {#h1-anchor}

## H2 {#h2-anchor}

### H3 {#h3-anchor}

#### H4 {#h4-anchor}

##### H5 {#h5-anchor}

###### H6 {#h6-anchor}
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
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## Very Long Heading That Would Make A Long Slug {#short}

Content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    const section = parsed.sections[0];
    expect(section.title).toBe('Very Long Heading That Would Make A Long Slug');
    expect(section.slug).toBe('short');
    expect(section.explicitId).toBe('short');
  });

  test('preserves heading title when using explicit anchor', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const content = `## Guest Purchase Flow {#guest-purchase}

Content.
`;
    const parsed = parser.parseContent(content, 'test.md');

    const section = parsed.sections[0];
    // Title should NOT include the anchor syntax
    expect(section.title).toBe('Guest Purchase Flow');
    expect(section.title).not.toContain('{#');
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
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner({
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const files = await scanner.findTestFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
  });

  test('supports comment-based annotations', () => {
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

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
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

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
    facet(Facets.FEATURES_CORE_PRODUCT_TEST_SCANNING);

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
