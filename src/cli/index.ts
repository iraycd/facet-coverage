import { Command } from 'commander';
import { generateCommand } from './commands/generate.js';
import { analyzeCommand } from './commands/analyze.js';
import { validateCommand } from './commands/validate.js';
import { watchCommand } from './commands/watch.js';

const program = new Command();

program
  .name('facet')
  .description('💎 Test every facet of your features - natural specifications with rigorous coverage tracking')
  .version('0.3.0');

// Generate command
program
  .command('generate [dir]')
  .description('Generate structure.json and TypeScript types from facet markdown files')
  .option('-o, --output <path>', 'Output directory for structure.json and facets.ts')
  .option('-t, --type <type>', 'Override facet type (default: derived from filename)')
  .option('-c, --config <path>', 'Path to config file')
  .option('--global', 'Generate global combined types at root .facet/')
  .option('--no-types', 'Skip TypeScript types generation')
  .option('-q, --quiet', 'Suppress ID change warnings')
  .action((dir, options) => generateCommand(dir, options));

// Analyze command
program
  .command('analyze')
  .description('Analyze facet coverage')
  .option('-c, --config <path>', 'Path to config file')
  .option('-f, --format <format>', 'Output format (json, html, markdown)')
  .option('-t, --threshold <number>', 'Coverage threshold percentage')
  .option('--json', 'Output results as JSON')
  .option('--silent', 'Suppress console output')
  .action(analyzeCommand);

// Validate command
program
  .command('validate')
  .description('Validate facet structure and test links')
  .option('-c, --config <path>', 'Path to config file')
  .option('--strict', 'Enable strict validation (require all tests linked)')
  .option('--json', 'Output results as JSON')
  .action(validateCommand);

// Watch command
program
  .command('watch')
  .description('Watch for changes and re-run analysis')
  .option('-c, --config <path>', 'Path to config file')
  .option('-v, --validate', 'Run validation before analysis')
  .action(watchCommand);

// Parse arguments
program.parse();
