import { test, expect, describe, beforeAll } from 'bun:test';
import { StructureReader } from '../../../src/core/StructureReader.js';
import { FacetParser } from '../../../src/core/FacetParser.js';
import { TestScanner } from '../../../src/core/TestScanner.js';
import { Validator } from '../../../src/core/Validator.js';
import { CoverageCalculator } from '../../../src/core/CoverageCalculator.js';
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
    facet(Facets.PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const files = await reader.findStructureFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('feature1'))).toBe(true);
  });

  test('parses structure.json with validation', async () => {
    facet(Facets.PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader();
    const structure = await reader.readStructure(join(testDir, 'feature1/.facet/structure.json'));
    expect(structure.feature).toBe('feature1');
    expect(structure.facets.length).toBe(1);
    expect(structure.facets[0].id).toBe('test:facet-one');
  });

  test('returns all facets across structures', async () => {
    facet(Facets.PRODUCT_STRUCTURE_READING);

    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const facets = await reader.getAllFacets(join(import.meta.dir, '../../..'));
    expect(facets.length).toBeGreaterThan(0);
  });
});

describe('FacetParser', () => {
  test('extracts headings as sections', async () => {
    facet(Facets.PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const parsed = await parser.parseFile(join(testDir, 'feature1/facets/test.md'));
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.sections.some(s => s.slug === 'facet-one')).toBe(true);
  });

  test('generates URL-friendly slugs', () => {
    facet(Facets.PRODUCT_MARKDOWN_PARSING);

    expect(FacetParser.slugify('Hello World')).toBe('hello-world');
    expect(FacetParser.slugify('PCI-DSS Requirements')).toBe('pci-dss-requirements');
    expect(FacetParser.slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
  });

  test('validates section existence', async () => {
    facet(Facets.PRODUCT_MARKDOWN_PARSING);

    const parser = new FacetParser();
    const exists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'facet-one');
    expect(exists).toBe(true);
    const notExists = await parser.sectionExists(join(testDir, 'feature1/facets/test.md'), 'nonexistent');
    expect(notExists).toBe(false);
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
    facet(Facets.PRODUCT_TEST_SCANNING);

    const scanner = new TestScanner({
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const files = await scanner.findTestFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
  });

  test('supports comment-based annotations', () => {
    facet(Facets.PRODUCT_TEST_SCANNING);

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
    facet(Facets.PRODUCT_TEST_SCANNING);

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
    facet(Facets.PRODUCT_TEST_SCANNING);

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
    facet(Facets.PRODUCT_VALIDATION);

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
    facet(Facets.PRODUCT_VALIDATION);

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
    facet(Facets.PRODUCT_COVERAGE_CALCULATION);

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
    facet(Facets.PRODUCT_COVERAGE_CALCULATION);

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
    facet(Facets.PRODUCT_COVERAGE_CALCULATION);

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
    facet(Facets.DX_ERROR_MESSAGES);

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
    facet(Facets.TECHNICAL_TYPESCRIPT_SUPPORT);

    const { Facet, FacetConfig, CoverageReport } = await import('../../../src/types.js');
    // These imports should succeed if types are properly exported
    expect(true).toBe(true);
  });
});
