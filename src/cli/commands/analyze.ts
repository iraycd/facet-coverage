import { CoverageCalculator } from '../../core/CoverageCalculator.js';
import { JsonReporter } from '../../reporters/JsonReporter.js';
import { HtmlReporter } from '../../reporters/HtmlReporter.js';
import { MarkdownReporter } from '../../reporters/MarkdownReporter.js';
import type { FacetConfig } from '../../types.js';
import { loadConfig } from '../utils/config.js';

interface AnalyzeOptions {
  config?: string;
  format?: string;
  threshold?: string;
  json?: boolean;
  silent?: boolean;
}

/**
 * Analyze facet coverage
 */
export async function analyzeCommand(options: AnalyzeOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Load config
  const config = await loadConfig(options.config, cwd);

  // Override with CLI options
  if (options.threshold) {
    config.thresholds.global = parseInt(options.threshold, 10);
  }

  if (!options.silent) {
    console.log('💎 Analyzing Facet Coverage...\n');
  }

  // Calculate coverage
  const calculator = new CoverageCalculator(config);
  const report = await calculator.calculateCoverage(cwd);

  // Check if any facets were found
  if (report.summary.totalFacets === 0) {
    if (!options.silent) {
      console.log('⚠️  No facets found. Make sure you have:');
      console.log('   1. Structure files matching: ' + config.structureFiles.join(', '));
      console.log('   2. Test files in: ' + config.testDir);
    }
    process.exit(0);
  }

  // Generate reports
  const formats = options.format
    ? [options.format as 'json' | 'html' | 'markdown']
    : config.output.formats;

  const outputPaths: string[] = [];

  if (formats.includes('json')) {
    const reporter = new JsonReporter(config);
    outputPaths.push(reporter.write(report, cwd));
  }

  if (formats.includes('html')) {
    const reporter = new HtmlReporter(config);
    outputPaths.push(reporter.write(report, cwd));
  }

  if (formats.includes('markdown')) {
    const reporter = new MarkdownReporter(config);
    outputPaths.push(reporter.write(report, cwd));
  }

  // Output results
  if (options.json) {
    // JSON output mode for CI
    const jsonReporter = new JsonReporter(config);
    console.log(jsonReporter.generateSummary(report));
  } else if (!options.silent) {
    printReport(report, config, outputPaths);
  }

  // Check thresholds
  const thresholdResult = calculator.checkThresholds(report);

  if (!thresholdResult.passed) {
    if (!options.silent) {
      console.log('\n❌ Coverage thresholds not met:');
      for (const failure of thresholdResult.failures) {
        console.log(`   - ${failure}`);
      }
    }
    process.exit(1);
  }
}

/**
 * Print coverage report to console
 */
function printReport(
  report: any,
  config: FacetConfig,
  outputPaths: string[]
): void {
  const { summary, byType, features, uncovered } = report;

  // Overall summary
  const overallIcon = summary.percentage >= 80 ? '✅' : summary.percentage >= 50 ? '🟡' : '❌';
  console.log(`${overallIcon} Overall Coverage: ${summary.percentage}%\n`);

  console.log('┌─────────────────────────────────────────────┐');
  console.log(`│ Total Facets:  ${String(summary.totalFacets).padStart(6)}                      │`);
  console.log(`│ Covered:       ${String(summary.coveredFacets).padStart(6)}                      │`);
  console.log(`│ Uncovered:     ${String(summary.uncoveredFacets).padStart(6)}                      │`);
  console.log('└─────────────────────────────────────────────┘');

  // By type
  if (byType.length > 0) {
    console.log('\nBy Type:');
    for (const type of byType) {
      const icon = type.percentage === 100 ? '✅' : type.percentage >= 75 ? '🟡' : '❌';
      const bar = createProgressBar(type.percentage);
      console.log(`  ${icon} ${type.type.padEnd(15)} ${bar} ${type.percentage}% (${type.covered}/${type.total})`);
    }
  }

  // Features
  if (features.length > 0) {
    console.log('\nFeatures:');
    for (const feature of features) {
      const icon = feature.percentage === 100 ? '✅' : feature.percentage >= 75 ? '🟡' : '❌';
      console.log(`  ${icon} ${feature.feature}: ${feature.percentage}% (${feature.coveredFacets}/${feature.totalFacets})`);
    }
  }

  // Uncovered facets
  if (uncovered.length > 0) {
    console.log(`\n❌ Uncovered Facets (${uncovered.length}):`);
    const maxDisplay = 10;
    for (const facet of uncovered.slice(0, maxDisplay)) {
      console.log(`  - ${facet.id} (${facet.type})`);
    }
    if (uncovered.length > maxDisplay) {
      console.log(`  ... and ${uncovered.length - maxDisplay} more`);
    }
  }

  // Output paths
  console.log('\nReports generated:');
  for (const path of outputPaths) {
    console.log(`  📄 ${path}`);
  }
}

/**
 * Create a simple progress bar
 */
function createProgressBar(percentage: number, width: number = 20): string {
  const filled = Math.round((percentage / 100) * width);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
}
