// Core exports
export {
  StructureReader,
  FacetParser,
  TestScanner,
  Validator,
  CoverageCalculator,
} from './core/index.js';

// Reporter exports
export {
  JsonReporter,
  HtmlReporter,
  MarkdownReporter,
} from './reporters/index.js';

// Playwright integration exports (re-export for convenience)
export {
  facet,
  FacetCoverageReporter,
  createFacetFixture,
} from './integrations/playwright.js';

// Type exports
export type {
  Facet,
  FacetStructure,
  TestLink,
  FacetCoverage,
  TypeCoverage,
  FeatureCoverage,
  CoverageReport,
  ValidationError,
  ValidationResult,
  FacetConfig,
  MarkdownSection,
  ParsedMarkdown,
} from './types.js';

export { defaultConfig } from './types.js';
