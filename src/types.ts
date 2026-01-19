/**
 * Core types for Facet Coverage
 */

/**
 * Represents a single facet in the structure
 */
export interface Facet {
  /** Unique identifier for this facet */
  id: string;
  /** Source file and section information */
  source: {
    /** Relative path to the facet file */
    file: string;
    /** Section identifier within the file (slug) */
    section: string;
    /** Line number for sub-facets */
    line?: number;
  };
  /** Type of facet (business, compliance, ux, etc.) */
  type: string;
  /** Optional human-readable title */
  title?: string;
  /** Optional description */
  description?: string;
  /** Parent facet ID for sub-facets (hierarchical structure) */
  parentId?: string;
  /** Whether this is a sub-facet (from list item ID or comment marker) */
  isSubFacet?: boolean;
}

/**
 * Structure definition for a feature
 */
export interface FacetStructure {
  /** Feature name */
  feature: string;
  /** List of facets in this feature */
  facets: Facet[];
  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Represents a test that links to facets
 */
export interface TestLink {
  /** Test file path */
  file: string;
  /** Test title/name */
  title: string;
  /** Full test name including describe blocks */
  fullTitle: string;
  /** Facet IDs this test covers */
  facetIds: string[];
  /** Line number in the test file */
  line?: number;
}

/**
 * A test without facet links
 */
export interface UnlinkedTest {
  /** Test file path */
  file: string;
  /** Test title/name */
  title: string;
  /** Full test name including describe blocks */
  fullTitle: string;
  /** Line number in the test file */
  line?: number;
}

/**
 * Coverage information for a single facet
 */
export interface FacetCoverage {
  /** The facet being tracked */
  facet: Facet;
  /** Whether this facet is covered by at least one test */
  covered: boolean;
  /** Tests that cover this facet */
  coveredBy: TestLink[];
}

/**
 * Coverage summary by facet type
 */
export interface TypeCoverage {
  /** Facet type */
  type: string;
  /** Total number of facets of this type */
  total: number;
  /** Number of covered facets */
  covered: number;
  /** Coverage percentage */
  percentage: number;
}

/**
 * Feature-level coverage summary
 */
export interface FeatureCoverage {
  /** Feature name */
  feature: string;
  /** Path to the feature directory */
  path: string;
  /** Total number of facets */
  totalFacets: number;
  /** Number of covered facets */
  coveredFacets: number;
  /** Coverage percentage */
  percentage: number;
  /** Coverage breakdown by type */
  byType: TypeCoverage[];
  /** Detailed facet coverage */
  facets: FacetCoverage[];
}

/**
 * Complete coverage report
 */
export interface CoverageReport {
  /** Timestamp when report was generated */
  timestamp: string;
  /** Overall coverage statistics */
  summary: {
    totalFacets: number;
    coveredFacets: number;
    uncoveredFacets: number;
    percentage: number;
  };
  /** Coverage breakdown by type across all features */
  byType: TypeCoverage[];
  /** Per-feature coverage details */
  features: FeatureCoverage[];
  /** All test links found */
  tests: TestLink[];
  /** Uncovered facets for easy access */
  uncovered: Facet[];
  /** Tests without facet annotations */
  unlinkedTests: UnlinkedTest[];
}

/**
 * Validation error
 */
export interface ValidationError {
  /** Error type */
  type: 'missing-source' | 'missing-section' | 'invalid-facet-id' | 'orphan-test' | 'duplicate-id' | 'orphan-subfacet';
  /** Error message */
  message: string;
  /** File where the error occurred */
  file?: string;
  /** Line number if applicable */
  line?: number;
  /** Related facet ID */
  facetId?: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** List of errors found */
  errors: ValidationError[];
  /** List of warnings */
  warnings: ValidationError[];
}

/**
 * Configuration options
 */
export interface FacetConfig {
  /** Glob patterns for structure files */
  structureFiles: string[];
  /** Test directory pattern */
  testDir: string;
  /** Test file patterns */
  testPatterns?: string[];
  /** Glob pattern(s) for finding facet markdown files */
  facetPattern?: string | string[];
  /** Known facet types used in this project (for resolving Facets.CONSTANT references) */
  facetTypes?: string[];
  /** Heading levels that become sub-facets (e.g., [3] for h3, [3, 4] for h3 and h4) */
  subFacetHeadingLevels?: number[];
  /** Validation options */
  validation: {
    /** Verify facet source files exist */
    requireSourceExists: boolean;
    /** Verify sections exist in source files */
    requireSectionExists: boolean;
    /** Require all tests to be linked to facets */
    requireAllTestsLinked: boolean;
  };
  /** Output options */
  output: {
    /** Output directory for reports */
    dir: string;
    /** Output formats to generate */
    formats: ('json' | 'html' | 'markdown')[];
  };
  /** Coverage thresholds */
  thresholds: {
    /** Global coverage threshold */
    global: number;
    /** Per-type thresholds */
    byType: Record<string, number>;
  };
}

/**
 * Default configuration
 */
export const defaultConfig: FacetConfig = {
  structureFiles: ['features/**/.facet/structure.json'],
  testDir: './features/**/tests',
  testPatterns: ['**/*.spec.ts', '**/*.test.ts'],
  facetPattern: ['features/**/*.facet.md', 'features/**/facets/*.md'],
  facetTypes: ['product', 'dx', 'technical', 'compliance', 'business', 'ux'],
  validation: {
    requireSourceExists: true,
    requireSectionExists: true,
    requireAllTestsLinked: false,
  },
  output: {
    dir: '.facet-coverage',
    formats: ['json', 'html', 'markdown'],
  },
  thresholds: {
    global: 75,
    byType: {},
  },
};

/**
 * Parsed section from a markdown file
 */
export interface MarkdownSection {
  /** Section title */
  title: string;
  /** Slug (URL-friendly version of title, or explicit ID if provided via [](#id)) */
  slug: string;
  /** Heading level (1-6) */
  level: number;
  /** Line number where section starts */
  startLine: number;
  /** Line number where section ends */
  endLine: number;
  /** Section content */
  content: string;
  /** Explicit ID if provided via [](#id) on line after heading */
  explicitId?: string;
  /** Sub-facet markers found within this section */
  subFacets?: SubFacetMarker[];
}

/**
 * Represents a sub-facet marker found within a section
 * Can be from <!-- @facet:id --> comment, [](#id) link, or heading
 */
export interface SubFacetMarker {
  /** The sub-facet ID (local, will be combined with parent) */
  id: string;
  /** Title extracted from the heading or nearby content */
  title?: string;
  /** Line number where the marker was found */
  line: number;
  /** Type of marker: 'comment' for <!-- @facet:id -->, 'link' for [](#id), 'heading' for h3+ */
  type: 'comment' | 'link' | 'heading';
}

/**
 * Parsed markdown file
 */
export interface ParsedMarkdown {
  /** File path */
  file: string;
  /** All sections in the file */
  sections: MarkdownSection[];
}
