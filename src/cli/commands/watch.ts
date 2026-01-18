import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { watch } from 'chokidar';
import { CoverageCalculator } from '../../core/CoverageCalculator.js';
import { Validator } from '../../core/Validator.js';
import { JsonReporter } from '../../reporters/JsonReporter.js';
import { HtmlReporter } from '../../reporters/HtmlReporter.js';
import { MarkdownReporter } from '../../reporters/MarkdownReporter.js';
import type { FacetConfig } from '../../types.js';
import { defaultConfig } from '../../types.js';

interface WatchOptions {
  config?: string;
  validate?: boolean;
}

/**
 * Watch for changes and re-run analysis
 */
export async function watchCommand(options: WatchOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Load config
  const config = await loadConfig(options.config, cwd);

  console.log('💎 Facet Coverage Watch Mode\n');
  console.log('Watching for changes...\n');

  // Initial run
  await runAnalysis(config, cwd, options.validate);

  // Watch patterns
  const watchPatterns = [
    ...config.structureFiles,
    'features/**/facets/**/*.md',
    `${config.testDir}/**/*.{ts,js,tsx,jsx}`,
  ];

  // Create watcher
  const watcher = watch(watchPatterns, {
    cwd,
    ignoreInitial: true,
    persistent: true,
  });

  // Debounce timer
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  watcher.on('all', (event, path) => {
    // Clear existing timer
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    // Debounce to avoid multiple rapid runs
    debounceTimer = setTimeout(async () => {
      console.log(`\n📝 Change detected: ${path} (${event})`);
      console.log('Re-analyzing...\n');

      await runAnalysis(config, cwd, options.validate);
    }, 300);
  });

  // Handle shutdown
  process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watch mode...');
    watcher.close();
    process.exit(0);
  });

  // Keep process alive
  console.log('Press Ctrl+C to stop.\n');
}

/**
 * Run analysis
 */
async function runAnalysis(
  config: FacetConfig,
  cwd: string,
  validate: boolean = false
): Promise<void> {
  const startTime = Date.now();

  try {
    // Optionally validate first
    if (validate) {
      const validator = new Validator(config);
      const validationResult = await validator.validate(cwd);

      if (!validationResult.valid) {
        console.log('❌ Validation failed:');
        for (const error of validationResult.errors) {
          console.log(`   - ${error.message}`);
        }
        console.log('');
        return;
      }
    }

    // Calculate coverage
    const calculator = new CoverageCalculator(config);
    const report = await calculator.calculateCoverage(cwd);

    // Generate reports
    if (config.output.formats.includes('json')) {
      const reporter = new JsonReporter(config);
      reporter.write(report, cwd);
    }

    if (config.output.formats.includes('html')) {
      const reporter = new HtmlReporter(config);
      reporter.write(report, cwd);
    }

    if (config.output.formats.includes('markdown')) {
      const reporter = new MarkdownReporter(config);
      reporter.write(report, cwd);
    }

    // Print summary
    const duration = Date.now() - startTime;
    const icon = report.summary.percentage >= 80 ? '✅' : report.summary.percentage >= 50 ? '🟡' : '❌';

    console.log('┌─────────────────────────────────────────────┐');
    console.log(`│ ${icon} Coverage: ${String(report.summary.percentage + '%').padEnd(6)} (${report.summary.coveredFacets}/${report.summary.totalFacets} facets)`.padEnd(45) + ' │');
    console.log('└─────────────────────────────────────────────┘');

    // Show type breakdown
    if (report.byType.length > 0) {
      for (const type of report.byType) {
        const typeIcon = type.percentage === 100 ? '✅' : type.percentage >= 75 ? '🟡' : '❌';
        console.log(`  ${typeIcon} ${type.type}: ${type.percentage}%`);
      }
    }

    console.log(`\n⏱️  Analysis completed in ${duration}ms`);

    // Check thresholds
    const thresholdResult = calculator.checkThresholds(report);
    if (!thresholdResult.passed) {
      console.log('\n⚠️  Thresholds not met:');
      for (const failure of thresholdResult.failures) {
        console.log(`   - ${failure}`);
      }
    }
  } catch (error) {
    console.error('❌ Error during analysis:', error);
  }
}

/**
 * Load configuration from file or use defaults
 */
async function loadConfig(configPath: string | undefined, cwd: string): Promise<FacetConfig> {
  const configFiles = [
    configPath,
    'facet.config.js',
    'facet.config.mjs',
    'facet.config.json',
  ].filter(Boolean) as string[];

  for (const file of configFiles) {
    const fullPath = resolve(cwd, file);

    if (existsSync(fullPath)) {
      if (file.endsWith('.json')) {
        const content = readFileSync(fullPath, 'utf-8');
        return { ...defaultConfig, ...JSON.parse(content) };
      } else {
        try {
          const imported = await import(fullPath);
          return { ...defaultConfig, ...(imported.default || imported) };
        } catch (error) {
          console.warn(`Warning: Could not load config from ${file}`);
        }
      }
    }
  }

  return defaultConfig;
}
