import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { CoverageReport, FacetConfig, FeatureCoverage, FacetCoverage } from '../types.js';
import { defaultConfig } from '../types.js';

/**
 * Generates Markdown coverage reports
 */
export class MarkdownReporter {
  private config: FacetConfig;

  constructor(config: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Generate Markdown report
   */
  generate(report: CoverageReport): string {
    const lines: string[] = [];

    // Header
    lines.push('# Facet Coverage Report');
    lines.push('');
    lines.push(`Generated: ${new Date(report.timestamp).toLocaleString()}`);
    lines.push('');

    // Overall Summary
    lines.push('## Overall Summary');
    lines.push('');
    lines.push(`| Metric | Value |`);
    lines.push(`| ------ | ----- |`);
    lines.push(`| **Coverage** | **${report.summary.percentage}%** |`);
    lines.push(`| Total Facets | ${report.summary.totalFacets} |`);
    lines.push(`| Covered | ${report.summary.coveredFacets} |`);
    lines.push(`| Uncovered | ${report.summary.uncoveredFacets} |`);
    lines.push('');

    // Coverage by Type
    if (report.byType.length > 0) {
      lines.push('## Coverage by Type');
      lines.push('');
      lines.push('| Type | Coverage | Covered | Total |');
      lines.push('| ---- | -------- | ------- | ----- |');

      for (const typeCov of report.byType) {
        const icon = typeCov.percentage === 100 ? '✅' : typeCov.percentage >= 75 ? '🟡' : '❌';
        lines.push(
          `| ${typeCov.type} | ${icon} ${typeCov.percentage}% | ${typeCov.covered} | ${typeCov.total} |`
        );
      }
      lines.push('');
    }

    // Per-Feature Coverage
    lines.push('## Features');
    lines.push('');

    for (const feature of report.features) {
      lines.push(...this.generateFeatureSection(feature));
      lines.push('');
    }

    // Uncovered Facets
    if (report.uncovered.length > 0) {
      lines.push('## Uncovered Facets');
      lines.push('');
      lines.push('The following facets are not covered by any tests:');
      lines.push('');

      for (const facet of report.uncovered) {
        lines.push(`- **${facet.id}** (${facet.type})`);
        lines.push(`  - Source: \`${facet.source.file}#${facet.source.section}\``);
      }
      lines.push('');
    }

    // Unlinked Tests
    if (report.unlinkedTests && report.unlinkedTests.length > 0) {
      lines.push('## Unlinked Tests');
      lines.push('');
      lines.push(`The following ${report.unlinkedTests.length} tests don't have facet annotations. Consider linking them to facets for better coverage tracking:`);
      lines.push('');

      for (const test of report.unlinkedTests) {
        lines.push(`- **${test.title}**`);
        lines.push(`  - File: \`${test.file}${test.line ? `:${test.line}` : ''}\``);
        if (test.fullTitle && test.fullTitle !== test.title) {
          lines.push(`  - Full title: ${test.fullTitle}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate section for a single feature
   */
  private generateFeatureSection(feature: FeatureCoverage): string[] {
    const lines: string[] = [];
    const icon = feature.percentage === 100 ? '✅' : feature.percentage >= 75 ? '🟡' : '❌';

    lines.push(`### ${feature.feature} ${icon}`);
    lines.push('');
    lines.push(`**Coverage:** ${feature.percentage}% (${feature.coveredFacets}/${feature.totalFacets} facets)`);
    lines.push('');

    // Type breakdown for this feature
    if (feature.byType.length > 1) {
      lines.push('| Type | Coverage |');
      lines.push('| ---- | -------- |');
      for (const typeCov of feature.byType) {
        lines.push(`| ${typeCov.type} | ${typeCov.percentage}% (${typeCov.covered}/${typeCov.total}) |`);
      }
      lines.push('');
    }

    // Covered facets
    const covered = feature.facets.filter(f => f.covered);
    if (covered.length > 0) {
      lines.push('#### Covered Facets');
      lines.push('');
      for (const fc of covered) {
        lines.push(...this.generateFacetDetails(fc, true));
      }
      lines.push('');
    }

    // Uncovered facets
    const uncovered = feature.facets.filter(f => !f.covered);
    if (uncovered.length > 0) {
      lines.push('#### Uncovered Facets');
      lines.push('');
      for (const fc of uncovered) {
        lines.push(...this.generateFacetDetails(fc, false));
      }
    }

    return lines;
  }

  /**
   * Generate details for a single facet
   */
  private generateFacetDetails(fc: FacetCoverage, showTests: boolean): string[] {
    const lines: string[] = [];
    const icon = fc.covered ? '✅' : '❌';

    lines.push(`##### ${icon} ${fc.facet.id}`);
    lines.push('');
    lines.push(`- **Type:** ${fc.facet.type}`);
    lines.push(`- **Source:** \`${fc.facet.source.file}#${fc.facet.source.section}\``);

    if (showTests && fc.coveredBy.length > 0) {
      lines.push(`- **Covered by:**`);
      for (const test of fc.coveredBy) {
        lines.push(`  - \`${test.file}\`: ${test.title}`);
      }
    }

    lines.push('');

    return lines;
  }

  /**
   * Write Markdown report to file
   */
  write(report: CoverageReport, cwd: string = process.cwd()): string {
    const outputDir = join(cwd, this.config.output.dir);
    const outputPath = join(outputDir, 'coverage.md');

    // Ensure output directory exists
    mkdirSync(outputDir, { recursive: true });

    const content = this.generate(report);
    writeFileSync(outputPath, content, 'utf-8');

    return outputPath;
  }
}
