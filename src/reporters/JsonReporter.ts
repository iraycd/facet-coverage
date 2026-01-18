import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import type { CoverageReport, FacetConfig } from '../types.js';
import { defaultConfig } from '../types.js';

/**
 * Generates JSON coverage reports
 */
export class JsonReporter {
  private config: FacetConfig;

  constructor(config: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Generate JSON report
   */
  generate(report: CoverageReport, cwd: string = process.cwd()): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * Write JSON report to file
   */
  write(report: CoverageReport, cwd: string = process.cwd()): string {
    const outputDir = join(cwd, this.config.output.dir);
    const outputPath = join(outputDir, 'coverage.json');

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    const content = this.generate(report, cwd);
    writeFileSync(outputPath, content, 'utf-8');

    return outputPath;
  }

  /**
   * Generate a minimal summary JSON (useful for CI)
   */
  generateSummary(report: CoverageReport): string {
    const summary = {
      timestamp: report.timestamp,
      coverage: report.summary.percentage,
      total: report.summary.totalFacets,
      covered: report.summary.coveredFacets,
      uncovered: report.summary.uncoveredFacets,
      byType: report.byType.reduce((acc, t) => {
        acc[t.type] = t.percentage;
        return acc;
      }, {} as Record<string, number>),
      features: report.features.map(f => ({
        name: f.feature,
        coverage: f.percentage,
        total: f.totalFacets,
        covered: f.coveredFacets,
      })),
    };

    return JSON.stringify(summary, null, 2);
  }
}
