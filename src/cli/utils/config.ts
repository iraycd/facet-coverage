import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import type { FacetConfig } from '../../types.js';
import { defaultConfig } from '../../types.js';

/**
 * Configuration file names to search for (in order of priority)
 */
const CONFIG_FILE_NAMES = [
  'facet.config.js',
  'facet.config.mjs',
  'facet.config.json',
];

/**
 * Load configuration from file or use defaults.
 * Supports .js, .mjs, and .json config formats.
 *
 * @param configPath - Optional explicit path to config file
 * @param cwd - Current working directory
 * @returns Merged configuration with defaults
 */
export async function loadConfig(
  configPath: string | undefined,
  cwd: string
): Promise<FacetConfig> {
  const configFiles = [
    configPath,
    ...CONFIG_FILE_NAMES,
  ].filter(Boolean) as string[];

  for (const file of configFiles) {
    const fullPath = resolve(cwd, file);

    if (existsSync(fullPath)) {
      if (file.endsWith('.json')) {
        const content = readFileSync(fullPath, 'utf-8');
        return mergeConfig(JSON.parse(content));
      } else {
        // Dynamic import for JS/MJS config
        try {
          const imported = await import(fullPath);
          return mergeConfig(imported.default || imported);
        } catch (error) {
          console.warn(`Warning: Could not load config from ${file}`);
        }
      }
    }
  }

  return defaultConfig;
}

/**
 * Deep merge user config with defaults.
 * Ensures nested objects like validation, output, and thresholds are properly merged.
 */
function mergeConfig(userConfig: Partial<FacetConfig>): FacetConfig {
  return {
    ...defaultConfig,
    ...userConfig,
    validation: {
      ...defaultConfig.validation,
      ...userConfig.validation,
    },
    output: {
      ...defaultConfig.output,
      ...userConfig.output,
    },
    thresholds: {
      ...defaultConfig.thresholds,
      ...userConfig.thresholds,
      byType: {
        ...defaultConfig.thresholds.byType,
        ...userConfig.thresholds?.byType,
      },
    },
  };
}

/**
 * Get the resolved config file path if one exists.
 */
export function findConfigFile(cwd: string): string | null {
  for (const file of CONFIG_FILE_NAMES) {
    const fullPath = resolve(cwd, file);
    if (existsSync(fullPath)) {
      return fullPath;
    }
  }
  return null;
}
