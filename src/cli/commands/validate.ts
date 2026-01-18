import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { Validator } from '../../core/Validator.js';
import type { FacetConfig, ValidationResult } from '../../types.js';
import { defaultConfig } from '../../types.js';

interface ValidateOptions {
  config?: string;
  strict?: boolean;
  json?: boolean;
}

/**
 * Validate facet structure and test links
 */
export async function validateCommand(options: ValidateOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Load config
  const config = await loadConfig(options.config, cwd);

  // Enable strict mode if requested
  if (options.strict) {
    config.validation.requireAllTestsLinked = true;
  }

  console.log('💎 Validating Facet Coverage...\n');

  const validator = new Validator(config);
  const result = await validator.validate(cwd);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    printValidationResult(result);
  }

  // Exit with error code if validation failed
  if (!result.valid) {
    process.exit(1);
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

/**
 * Print validation results
 */
function printValidationResult(result: ValidationResult): void {
  if (result.valid && result.warnings.length === 0) {
    console.log('✅ Validation passed! No issues found.\n');
    return;
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log(`❌ Errors (${result.errors.length}):\n`);

    for (const error of result.errors) {
      const location = error.file ? ` in ${error.file}` : '';
      const line = error.line ? `:${error.line}` : '';
      const facet = error.facetId ? ` [${error.facetId}]` : '';

      console.log(`  ${getErrorIcon(error.type)} ${error.message}${location}${line}${facet}`);
    }
    console.log('');
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log(`⚠️  Warnings (${result.warnings.length}):\n`);

    for (const warning of result.warnings) {
      const location = warning.file ? ` in ${warning.file}` : '';
      const line = warning.line ? `:${warning.line}` : '';
      const facet = warning.facetId ? ` [${warning.facetId}]` : '';

      console.log(`  ⚠️  ${warning.message}${location}${line}${facet}`);
    }
    console.log('');
  }

  // Summary
  if (result.valid) {
    console.log('✅ Validation passed with warnings.');
  } else {
    console.log('❌ Validation failed. Please fix the errors above.');
  }
}

/**
 * Get icon for error type
 */
function getErrorIcon(type: string): string {
  switch (type) {
    case 'missing-source':
      return '📄';
    case 'missing-section':
      return '📑';
    case 'invalid-facet-id':
      return '🏷️';
    case 'orphan-test':
      return '🔗';
    case 'duplicate-id':
      return '🔄';
    default:
      return '❌';
  }
}
