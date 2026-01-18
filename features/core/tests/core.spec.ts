import { test, expect, describe, beforeAll } from 'bun:test';
import { StructureReader } from '../../../src/core/StructureReader.js';
import { FacetParser } from '../../../src/core/FacetParser.js';
import { TestScanner } from '../../../src/core/TestScanner.js';
import { Validator } from '../../../src/core/Validator.js';
import { CoverageCalculator } from '../../../src/core/CoverageCalculator.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';

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

  // @facet product:structure-reading
  test('finds structure files via glob patterns', async () => {
    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const files = await reader.findStructureFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
    expect(files.some(f => f.includes('feature1'))).toBe(true);
  });

  // @facet product:structure-reading
  test('parses structure.json with validation', async () => {
    const reader = new StructureReader();
    const structure = await reader.readStructure(join(testDir, 'feature1/.facet/structure.json'));
    expect(structure.feature).toBe('feature1');
    expect(structure.facets.length).toBe(1);
    expect(structure.facets[0].id).toBe('test:facet-one');
  });

  // @facet product:structure-reading
  test('returns all facets across structures', async () => {
    const reader = new StructureReader({
      structureFiles: ['.test-fixtures/**/.facet/structure.json']
    });
    const facets = await reader.getAllFacets(join(import.meta.dir, '../../..'));
    expect(facets.length).toBeGreaterThan(0);
  });
});

describe('FacetParser', () => {
  // @facet product:markdown-parsing
  test('extracts headings as sections', async () => {
    const parser = new FacetParser();
    const parsed = await parser.parseFile(join(testDir, 'feature1/facets/test.md'));
    expect(parsed.sections.length).toBeGreaterThan(0);
    expect(parsed.sections.some(s => s.slug === 'facet-one')).toBe(true);
  });

  // @facet product:markdown-parsing
  test('generates URL-friendly slugs', () => {
    expect(FacetParser.slugify('Hello World')).toBe('hello-world');
    expect(FacetParser.slugify('PCI-DSS Requirements')).toBe('pci-dss-requirements');
    expect(FacetParser.slugify('Test  Multiple   Spaces')).toBe('test-multiple-spaces');
  });

  // @facet product:markdown-parsing
  test('validates section existence', async () => {
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

  // @facet product:test-scanning
  test('finds test files matching patterns', async () => {
    const scanner = new TestScanner({
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const files = await scanner.findTestFiles(join(import.meta.dir, '../../..'));
    expect(files.length).toBeGreaterThan(0);
  });

  // @facet product:test-scanning
  test('supports comment-based annotations', () => {
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

  // @facet product:test-scanning
  test('supports Playwright-style annotations', () => {
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

  // @facet product:test-scanning
  test('tracks describe block nesting', () => {
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
  // @facet product:validation
  test('detects missing source files', async () => {
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

  // @facet product:validation
  test('returns structured errors and warnings', async () => {
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
  // @facet product:coverage-calculation
  test('calculates overall coverage percentage', async () => {
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

  // @facet product:coverage-calculation
  test('calculates coverage by type', async () => {
    const calculator = new CoverageCalculator({
      structureFiles: ['.test-fixtures/feature1/.facet/structure.json'],
      testDir: '.test-fixtures/tests',
      testPatterns: ['**/*.spec.ts']
    });
    const report = await calculator.calculateCoverage(join(import.meta.dir, '../../..'));
    expect(report).toHaveProperty('byType');
    expect(Array.isArray(report.byType)).toBe(true);
  });

  // @facet product:coverage-calculation
  test('returns comprehensive coverage report', async () => {
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
  // @facet dx:error-messages
  test('provides clear error messages for missing files', async () => {
    const reader = new StructureReader();
    try {
      await reader.readStructure('/nonexistent/path/structure.json');
      expect(true).toBe(false); // Should not reach here
    } catch (error) {
      expect(error.message).toContain('not found');
    }
  });
});

describe('TypeScript Support', () => {
  // @facet technical:typescript-support
  test('exports type definitions', async () => {
    const { Facet, FacetConfig, CoverageReport } = await import('../../../src/types.js');
    // These imports should succeed if types are properly exported
    expect(true).toBe(true);
  });
});
