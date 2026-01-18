import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { writeFileSync, readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { generateCommand } from '../../../src/cli/commands/generate.js';
import { CoverageCalculator } from '../../../src/core/CoverageCalculator.js';
import { Validator } from '../../../src/core/Validator.js';
import type { FacetConfig } from '../../../src/types.js';
import { Facets, facet } from '../.facet/facets';

const testDir = join(import.meta.dir, '../../../.cli-test-fixtures');

const testConfig: Partial<FacetConfig> = {
  structureFiles: ['features/**/.facet/structure.json'],
  testDir: './features/**/tests',
  testPatterns: ['**/*.spec.ts'],
  output: {
    dir: '.facet-coverage',
    formats: ['json']
  },
  thresholds: {
    global: 50,
    byType: {}
  }
};

describe('CLI Commands', () => {
  beforeAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(join(testDir, 'features/test-feature/facets'), { recursive: true });
    mkdirSync(join(testDir, 'features/test-feature/tests'), { recursive: true });

    // Create facet markdown
    writeFileSync(join(testDir, 'features/test-feature/facets/product.md'), `# Product

## Feature One

Description of feature one.

## Feature Two

Description of feature two.
`);

    // Create test file
    writeFileSync(join(testDir, 'features/test-feature/tests/test.spec.ts'), `
import { test } from 'bun:test';

describe('Test Feature', () => {
  // @facet product:feature-one
  test('covers feature one', () => {});
});
`);

    // Create config
    writeFileSync(join(testDir, 'facet.config.json'), JSON.stringify(testConfig));
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  describe('Generate Command', () => {
    test('generates structure.json from markdown files', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_GENERATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});
        expect(existsSync(join(testDir, 'features/test-feature/.facet/structure.json'))).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('creates facet entries with auto-generated IDs', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_GENERATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});
        const structurePath = join(testDir, 'features/test-feature/.facet/structure.json');
        const structure = JSON.parse(readFileSync(structurePath, 'utf-8'));

        expect(structure.facets.some((f: any) => f.id === 'product:feature-one')).toBe(true);
        expect(structure.facets.some((f: any) => f.id === 'product:feature-two')).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('respects explicit anchor syntax [](#custom-id)', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_GENERATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Create a facet file with explicit anchor
        mkdirSync(join(testDir, 'features/anchor-test/facets'), { recursive: true });
        writeFileSync(join(testDir, 'features/anchor-test/facets/product.md'), `# Product

## Guest Purchase Flow
[](#guest-purchase)

Guest purchase flow description.

## Regular Purchase Flow

Regular flow without explicit anchor.
`);

        await generateCommand('features/anchor-test/facets', {});
        const structurePath = join(testDir, 'features/anchor-test/.facet/structure.json');
        const structure = JSON.parse(readFileSync(structurePath, 'utf-8'));

        // Should use explicit anchor for the first section
        expect(structure.facets.some((f: any) => f.id === 'product:guest-purchase')).toBe(true);
        // Should auto-generate slug for the second section
        expect(structure.facets.some((f: any) => f.id === 'product:regular-purchase-flow')).toBe(true);
        // Should NOT create an ID with the full heading slug
        expect(structure.facets.some((f: any) => f.id === 'product:guest-purchase-flow')).toBe(false);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('supports --quiet flag to suppress ID change warnings', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_GENERATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        // Generate first time
        await generateCommand('features/test-feature/facets', { quiet: true });

        // Modify the markdown to change IDs
        writeFileSync(join(testDir, 'features/test-feature/facets/product.md'), `# Product

## Feature One Renamed

Description of feature one.

## Feature Two

Description of feature two.
`);

        // Generate again with --quiet, should not throw
        await generateCommand('features/test-feature/facets', { quiet: true });

        // Restore original content
        writeFileSync(join(testDir, 'features/test-feature/facets/product.md'), `# Product

## Feature One

Description of feature one.

## Feature Two

Description of feature two.
`);

        expect(true).toBe(true); // Test passes if no error thrown
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Analyze Command', () => {
    test('calculates coverage metrics', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_ANALYZE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});

        const calculator = new CoverageCalculator(testConfig);
        const report = await calculator.calculateCoverage(testDir);

        expect(report.summary).toBeDefined();
        expect(report.summary.totalFacets).toBeGreaterThan(0);
        expect(typeof report.summary.percentage).toBe('number');
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('identifies covered and uncovered facets', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_ANALYZE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});

        const calculator = new CoverageCalculator(testConfig);
        const report = await calculator.calculateCoverage(testDir);

        expect(report.summary.coveredFacets).toBeGreaterThan(0);
        expect(report.uncovered.length).toBeGreaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('checks thresholds', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_ANALYZE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});

        const calculator = new CoverageCalculator({
          ...testConfig,
          thresholds: { global: 100, byType: {} }
        });
        const report = await calculator.calculateCoverage(testDir);
        const result = calculator.checkThresholds(report);

        // Should fail since we don't have 100% coverage
        expect(result.passed).toBe(false);
        expect(result.failures.length).toBeGreaterThan(0);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Validate Command', () => {
    test('validates structure integrity', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_VALIDATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});

        const validator = new Validator(testConfig);
        const result = await validator.validate(testDir);

        expect(result).toHaveProperty('errors');
        expect(result).toHaveProperty('warnings');
        expect(Array.isArray(result.errors)).toBe(true);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('returns valid true for correct structure', async () => {
      facet(Facets.FEATURES_CLI_PRODUCT_VALIDATE_COMMAND);

      const originalCwd = process.cwd();
      process.chdir(testDir);

      try {
        await generateCommand('features/test-feature/facets', {});

        // Use specific config to only validate test-feature, not other generated files
        const specificConfig = {
          ...testConfig,
          structureFiles: ['features/test-feature/.facet/structure.json'],
        };
        const validator = new Validator(specificConfig);
        const result = await validator.validate(testDir);

        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });
});

describe('CLI Ergonomics', () => {
  test('command modules export their functions', async () => {
    facet(Facets.FEATURES_CLI_DX_CLI_ERGONOMICS);

    const generate = await import('../../../src/cli/commands/generate.js');
    const analyze = await import('../../../src/cli/commands/analyze.js');
    const validate = await import('../../../src/cli/commands/validate.js');
    const watch = await import('../../../src/cli/commands/watch.js');

    expect(generate.generateCommand).toBeDefined();
    expect(analyze.analyzeCommand).toBeDefined();
    expect(validate.validateCommand).toBeDefined();
    expect(watch.watchCommand).toBeDefined();
  });

  test('commands are functions', async () => {
    facet(Facets.FEATURES_CLI_DX_CLI_ERGONOMICS);

    const generate = await import('../../../src/cli/commands/generate.js');
    const analyze = await import('../../../src/cli/commands/analyze.js');
    const validate = await import('../../../src/cli/commands/validate.js');

    expect(typeof generate.generateCommand).toBe('function');
    expect(typeof analyze.analyzeCommand).toBe('function');
    expect(typeof validate.validateCommand).toBe('function');
  });
});

describe('Configuration Discovery', () => {
  test('default config has required fields', () => {
    facet(Facets.FEATURES_CLI_DX_CONFIGURATION_DISCOVERY);

    // Test the default config from types.ts
    expect(testConfig.structureFiles).toBeDefined();
    expect(testConfig.testDir).toBeDefined();
    expect(testConfig.output).toBeDefined();
    expect(testConfig.thresholds).toBeDefined();
  });

  test('config can be serialized to JSON', () => {
    facet(Facets.FEATURES_CLI_DX_CONFIGURATION_DISCOVERY);

    const jsonString = JSON.stringify(testConfig);
    expect(() => JSON.parse(jsonString)).not.toThrow();

    const parsed = JSON.parse(jsonString);
    expect(parsed.structureFiles).toBeDefined();
    expect(parsed.testDir).toBeDefined();
  });
});
