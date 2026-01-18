import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { FacetConfig, CoverageReport, TestLink } from '../types.js';
import { defaultConfig } from '../types.js';
import { CoverageCalculator } from '../core/CoverageCalculator.js';
import { JsonReporter } from '../reporters/JsonReporter.js';
import { HtmlReporter } from '../reporters/HtmlReporter.js';
import { MarkdownReporter } from '../reporters/MarkdownReporter.js';

/**
 * Helper function to link tests to facets
 *
 * @example
 * test('my test', {
 *   annotation: facet('guest-checkout-flow', 'pci-card-masking')
 * }, async ({ page }) => {
 *   // test code
 * });
 */
export function facet(...facetIds: string[]): { type: string; description: string } {
  return {
    type: 'facet-coverage',
    description: facetIds.join(','),
  };
}

/**
 * Type for Playwright test annotations
 */
export interface FacetAnnotation {
  type: 'facet-coverage';
  description: string;
}

/**
 * Playwright reporter interface (minimal type to avoid direct dependency)
 */
interface PlaywrightTestCase {
  title: string;
  titlePath(): string[];
  location: { file: string; line: number };
  annotations: Array<{ type: string; description?: string }>;
}

interface PlaywrightTestResult {
  status: 'passed' | 'failed' | 'timedOut' | 'skipped' | 'interrupted';
}

interface PlaywrightFullResult {
  status: 'passed' | 'failed' | 'timedOut' | 'interrupted';
}

interface PlaywrightFullConfig {
  rootDir: string;
}

interface PlaywrightSuite {
  title: string;
  suites: PlaywrightSuite[];
  tests: PlaywrightTestCase[];
}

/**
 * Playwright reporter for Facet coverage
 *
 * @example
 * // playwright.config.ts
 * import { FacetCoverageReporter } from 'facet-coverage/playwright';
 *
 * export default {
 *   reporter: [
 *     ['html'],
 *     [FacetCoverageReporter]
 *   ]
 * };
 */
export class FacetCoverageReporter {
  private config: FacetConfig;
  private testLinks: TestLink[] = [];
  private rootDir: string = process.cwd();

  constructor(options: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...options };
  }

  onBegin(config: PlaywrightFullConfig, suite: PlaywrightSuite): void {
    this.rootDir = config.rootDir;
    this.testLinks = [];
  }

  onTestEnd(test: PlaywrightTestCase, result: PlaywrightTestResult): void {
    // Only process passed tests for coverage
    if (result.status !== 'passed') {
      return;
    }

    // Find facet annotations
    const facetAnnotations = test.annotations.filter(
      a => a.type === 'facet-coverage' && a.description
    );

    for (const annotation of facetAnnotations) {
      const facetIds = annotation.description!.split(',').map(id => id.trim());

      if (facetIds.length > 0) {
        const titlePath = test.titlePath();
        const fullTitle = titlePath.join(' > ');

        this.testLinks.push({
          file: test.location.file.replace(this.rootDir + '/', ''),
          title: test.title,
          fullTitle,
          facetIds,
          line: test.location.line,
        });
      }
    }
  }

  async onEnd(result: PlaywrightFullResult): Promise<void> {
    // Write collected test links to a temp file for the coverage calculator
    const tempDir = join(this.rootDir, this.config.output.dir);
    mkdirSync(tempDir, { recursive: true });

    const linksPath = join(tempDir, '.test-links.json');
    writeFileSync(linksPath, JSON.stringify(this.testLinks, null, 2));

    // Calculate coverage using the collected links
    const calculator = new CoverageCalculator(this.config);
    const report = await this.calculateCoverageWithLinks(calculator);

    // Generate reports
    await this.generateReports(report);

    // Print summary to console
    this.printSummary(report);
  }

  /**
   * Calculate coverage using collected test links
   */
  private async calculateCoverageWithLinks(calculator: CoverageCalculator): Promise<CoverageReport> {
    // For now, use the standard calculator
    // In the future, we could inject our collected links
    const report = await calculator.calculateCoverage(this.rootDir);

    // Merge our collected links with any found by scanning
    // This ensures we capture runtime annotations that might not be statically detected
    const existingFiles = new Set(report.tests.map(t => `${t.file}:${t.line}`));

    for (const link of this.testLinks) {
      const key = `${link.file}:${link.line}`;
      if (!existingFiles.has(key)) {
        report.tests.push(link);
      }
    }

    return report;
  }

  /**
   * Generate all configured report formats
   */
  private async generateReports(report: CoverageReport): Promise<void> {
    const formats = this.config.output.formats;

    if (formats.includes('json')) {
      const jsonReporter = new JsonReporter(this.config);
      jsonReporter.write(report, this.rootDir);
    }

    if (formats.includes('html')) {
      const htmlReporter = new HtmlReporter(this.config);
      htmlReporter.write(report, this.rootDir);
    }

    if (formats.includes('markdown')) {
      const mdReporter = new MarkdownReporter(this.config);
      mdReporter.write(report, this.rootDir);
    }
  }

  /**
   * Print coverage summary to console
   */
  private printSummary(report: CoverageReport): void {
    console.log('\n💎 Facet Coverage Report\n');
    console.log(`Overall: ${report.summary.percentage}% (${report.summary.coveredFacets}/${report.summary.totalFacets} facets)`);

    if (report.byType.length > 0) {
      console.log('\nBy Type:');
      for (const type of report.byType) {
        const icon = type.percentage === 100 ? '✅' : type.percentage >= 75 ? '🟡' : '❌';
        console.log(`  ${icon} ${type.type}: ${type.percentage}% (${type.covered}/${type.total})`);
      }
    }

    if (report.features.length > 0) {
      console.log('\nFeatures:');
      for (const feature of report.features) {
        const icon = feature.percentage === 100 ? '✅' : feature.percentage >= 75 ? '🟡' : '❌';
        console.log(`  ${icon} ${feature.feature}: ${feature.percentage}% (${feature.coveredFacets}/${feature.totalFacets})`);
      }
    }

    if (report.uncovered.length > 0) {
      console.log(`\n❌ Uncovered Facets (${report.uncovered.length}):`);
      for (const facet of report.uncovered.slice(0, 5)) {
        console.log(`  - ${facet.id} (${facet.type})`);
      }
      if (report.uncovered.length > 5) {
        console.log(`  ... and ${report.uncovered.length - 5} more`);
      }
    }

    console.log(`\nReports: ${join(this.rootDir, this.config.output.dir)}/`);
  }
}

/**
 * Create a facet coverage fixture for Playwright
 */
export function createFacetFixture() {
  return {
    facet,
    FacetCoverageReporter,
  };
}
