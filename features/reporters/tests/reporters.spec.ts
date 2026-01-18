import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { JsonReporter } from '../../../src/reporters/JsonReporter.js';
import { HtmlReporter } from '../../../src/reporters/HtmlReporter.js';
import { MarkdownReporter } from '../../../src/reporters/MarkdownReporter.js';
import { readFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import type { CoverageReport } from '../../../src/types.js';
import { Facets, facet } from '../.facet/facets';

const testDir = join(import.meta.dir, '../../../.reporter-test-fixtures');

const mockReport: CoverageReport = {
  timestamp: new Date().toISOString(),
  summary: {
    totalFacets: 4,
    coveredFacets: 2,
    uncoveredFacets: 2,
    percentage: 50
  },
  byType: [
    { type: 'product', total: 2, covered: 1, percentage: 50 },
    { type: 'dx', total: 2, covered: 1, percentage: 50 }
  ],
  features: [
    {
      feature: 'test-feature',
      path: 'features/test-feature',
      totalFacets: 4,
      coveredFacets: 2,
      percentage: 50,
      facets: [
        {
          facet: { id: 'product:feature-one', type: 'product', title: 'Feature One', source: { file: 'product.md', section: 'feature-one' } },
          covered: true,
          coveredBy: [{ file: 'test.spec.ts', title: 'test one', fullTitle: 'Test > test one', facetIds: ['product:feature-one'], line: 10 }]
        },
        {
          facet: { id: 'product:feature-two', type: 'product', title: 'Feature Two', source: { file: 'product.md', section: 'feature-two' } },
          covered: false,
          coveredBy: []
        },
        {
          facet: { id: 'dx:ux-one', type: 'dx', title: 'UX One', source: { file: 'dx.md', section: 'ux-one' } },
          covered: true,
          coveredBy: [{ file: 'test.spec.ts', title: 'test two', fullTitle: 'Test > test two', facetIds: ['dx:ux-one'], line: 15 }]
        },
        {
          facet: { id: 'dx:ux-two', type: 'dx', title: 'UX Two', source: { file: 'dx.md', section: 'ux-two' } },
          covered: false,
          coveredBy: []
        }
      ],
      byType: [
        { type: 'product', total: 2, covered: 1, percentage: 50 },
        { type: 'dx', total: 2, covered: 1, percentage: 50 }
      ]
    }
  ],
  uncovered: [
    { id: 'product:feature-two', type: 'product', title: 'Feature Two', source: { file: 'product.md', section: 'feature-two' } },
    { id: 'dx:ux-two', type: 'dx', title: 'UX Two', source: { file: 'dx.md', section: 'ux-two' } }
  ],
  tests: [
    { file: 'test.spec.ts', title: 'test one', fullTitle: 'Test > test one', facetIds: ['product:feature-one'], line: 10 },
    { file: 'test.spec.ts', title: 'test two', fullTitle: 'Test > test two', facetIds: ['dx:ux-one'], line: 15 }
  ]
};

describe('JSON Reporter', () => {
  beforeAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
    mkdirSync(testDir, { recursive: true });
  });

  afterAll(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true });
    }
  });

  test('outputs complete coverage data as JSON', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_JSON_REPORTER);

    const reporter = new JsonReporter({ output: { dir: '.reporter-test-fixtures', formats: ['json'] } });
    const outputPath = reporter.write(mockReport, join(import.meta.dir, '../../..'));

    expect(existsSync(outputPath)).toBe(true);

    const content = JSON.parse(readFileSync(outputPath, 'utf-8'));
    expect(content.summary.totalFacets).toBe(4);
    expect(content.summary.percentage).toBe(50);
  });

  test('includes timestamp in report', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_JSON_REPORTER);

    const reporter = new JsonReporter({ output: { dir: '.reporter-test-fixtures', formats: ['json'] } });
    reporter.write(mockReport, join(import.meta.dir, '../../..'));

    const content = JSON.parse(readFileSync(join(testDir, 'coverage.json'), 'utf-8'));
    expect(content.timestamp).toBeDefined();
  });

  test('includes coverage breakdown by type', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_JSON_REPORTER);

    const reporter = new JsonReporter({ output: { dir: '.reporter-test-fixtures', formats: ['json'] } });
    reporter.write(mockReport, join(import.meta.dir, '../../..'));

    const content = JSON.parse(readFileSync(join(testDir, 'coverage.json'), 'utf-8'));
    expect(content.byType).toBeDefined();
    expect(content.byType.length).toBe(2);
  });

  test('generates valid parseable JSON', () => {
    facet(Facets.FEATURES_REPORTERS_DX_REPORT_ACCESSIBILITY);

    const reporter = new JsonReporter({ output: { dir: '.reporter-test-fixtures', formats: ['json'] } });
    const jsonString = reporter.generate(mockReport);
    expect(() => JSON.parse(jsonString)).not.toThrow();
  });
});

describe('HTML Reporter', () => {
  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  test('generates self-contained HTML file', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_HTML_REPORTER);

    const reporter = new HtmlReporter({ output: { dir: '.reporter-test-fixtures', formats: ['html'] } });
    const outputPath = reporter.write(mockReport, join(import.meta.dir, '../../..'));

    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');
    expect(content).toContain('<!DOCTYPE html>');
    expect(content).toContain('<style>');
    expect(content).not.toContain('stylesheet" href='); // No external stylesheets
  });

  test('displays overall coverage percentage', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_HTML_REPORTER);

    const reporter = new HtmlReporter({ output: { dir: '.reporter-test-fixtures', formats: ['html'] } });
    const content = reporter.generate(mockReport);
    expect(content).toContain('50%');
  });

  test('shows coverage breakdown by type', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_HTML_REPORTER);

    const reporter = new HtmlReporter({ output: { dir: '.reporter-test-fixtures', formats: ['html'] } });
    const content = reporter.generate(mockReport);
    expect(content).toContain('product');
    expect(content).toContain('dx');
  });

  test('lists uncovered facets', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_HTML_REPORTER);

    const reporter = new HtmlReporter({ output: { dir: '.reporter-test-fixtures', formats: ['html'] } });
    const content = reporter.generate(mockReport);
    expect(content).toContain('feature-two');
    expect(content).toContain('ux-two');
  });

  test('uses visual coverage indicators', () => {
    facet(Facets.FEATURES_REPORTERS_DX_REPORT_READABILITY);

    const reporter = new HtmlReporter({ output: { dir: '.reporter-test-fixtures', formats: ['html'] } });
    const content = reporter.generate(mockReport);
    // Should have color-coded elements
    expect(content).toMatch(/#22c55e|#eab308|#ef4444/); // green, yellow, red
  });
});

describe('Markdown Reporter', () => {
  beforeAll(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  test('generates valid Markdown document', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_MARKDOWN_REPORTER);

    const reporter = new MarkdownReporter({ output: { dir: '.reporter-test-fixtures', formats: ['markdown'] } });
    const outputPath = reporter.write(mockReport, join(import.meta.dir, '../../..'));

    expect(existsSync(outputPath)).toBe(true);

    const content = readFileSync(outputPath, 'utf-8');
    expect(content).toContain('# ');
    expect(content).toContain('|');
  });

  test('includes summary table', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_MARKDOWN_REPORTER);

    const reporter = new MarkdownReporter({ output: { dir: '.reporter-test-fixtures', formats: ['markdown'] } });
    const content = reporter.generate(mockReport);
    expect(content).toContain('Total Facets');
    expect(content).toContain('4');
  });

  test('includes coverage by type table', () => {
    facet(Facets.FEATURES_REPORTERS_PRODUCT_MARKDOWN_REPORTER);

    const reporter = new MarkdownReporter({ output: { dir: '.reporter-test-fixtures', formats: ['markdown'] } });
    const content = reporter.generate(mockReport);
    expect(content).toContain('product');
    expect(content).toContain('50%');
  });

  test('uses emoji indicators for status', () => {
    facet(Facets.FEATURES_REPORTERS_DX_REPORT_READABILITY);

    const reporter = new MarkdownReporter({ output: { dir: '.reporter-test-fixtures', formats: ['markdown'] } });
    const content = reporter.generate(mockReport);
    expect(content).toMatch(/[✅✓⚠️❌🟡]/);
  });

  test('renders correctly as Markdown', () => {
    facet(Facets.FEATURES_REPORTERS_DX_REPORT_ACCESSIBILITY);

    const reporter = new MarkdownReporter({ output: { dir: '.reporter-test-fixtures', formats: ['markdown'] } });
    const content = reporter.generate(mockReport);
    // Check for proper table formatting
    expect(content).toMatch(/\|.*\|.*\|/);
    expect(content).toMatch(/\| -+ \|/); // Match table separator like | ---- |
  });
});
