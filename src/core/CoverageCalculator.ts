import { dirname } from 'path';
import type {
  FacetConfig,
  FacetStructure,
  Facet,
  TestLink,
  UnlinkedTest,
  FacetCoverage,
  TypeCoverage,
  FeatureCoverage,
  CoverageReport
} from '../types.js';
import { defaultConfig } from '../types.js';
import { StructureReader } from './StructureReader.js';
import { TestScanner } from './TestScanner.js';

/**
 * Calculates coverage metrics for facets
 */
export class CoverageCalculator {
  private config: FacetConfig;
  private structureReader: StructureReader;
  private testScanner: TestScanner;

  constructor(config: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.structureReader = new StructureReader(this.config);
    this.testScanner = new TestScanner(this.config);
  }

  /**
   * Calculate complete coverage report
   */
  async calculateCoverage(cwd: string = process.cwd()): Promise<CoverageReport> {
    // Get all structures and test links (including unlinked tests)
    const structures = await this.structureReader.readAllStructures(cwd);
    const scanResult = await this.testScanner.scanAllTestsWithUnlinked(cwd);
    const testLinks = scanResult.linkedTests;
    const unlinkedTests = scanResult.unlinkedTests;

    // Build facet ID to test links map
    const facetToTests = new Map<string, TestLink[]>();
    for (const link of testLinks) {
      for (const facetId of link.facetIds) {
        const existing = facetToTests.get(facetId) || [];
        existing.push(link);
        facetToTests.set(facetId, existing);
      }
    }

    // Calculate feature-level coverage
    const features: FeatureCoverage[] = [];
    const allFacets: FacetCoverage[] = [];
    const uncovered: Facet[] = [];

    for (const [structureFile, structure] of structures) {
      const featureCoverage = this.calculateFeatureCoverage(
        structure,
        structureFile,
        facetToTests
      );
      features.push(featureCoverage);

      // Collect all facet coverage data
      allFacets.push(...featureCoverage.facets);

      // Collect uncovered facets
      for (const fc of featureCoverage.facets) {
        if (!fc.covered) {
          uncovered.push(fc.facet);
        }
      }
    }

    // Calculate overall statistics
    const totalFacets = allFacets.length;
    const coveredFacets = allFacets.filter(f => f.covered).length;
    const uncoveredFacets = totalFacets - coveredFacets;
    const percentage = totalFacets > 0 ? Math.round((coveredFacets / totalFacets) * 100) : 100;

    // Calculate coverage by type
    const byType = this.calculateTypeCoverage(allFacets);

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalFacets,
        coveredFacets,
        uncoveredFacets,
        percentage,
      },
      byType,
      features,
      tests: testLinks,
      uncovered,
      unlinkedTests,
    };
  }

  /**
   * Calculate coverage for a single feature
   */
  private calculateFeatureCoverage(
    structure: FacetStructure,
    structureFile: string,
    facetToTests: Map<string, TestLink[]>
  ): FeatureCoverage {
    const facetCoverages: FacetCoverage[] = [];

    for (const facet of structure.facets) {
      const coveredBy = facetToTests.get(facet.id) || [];
      facetCoverages.push({
        facet,
        covered: coveredBy.length > 0,
        coveredBy,
      });
    }

    const totalFacets = facetCoverages.length;
    const coveredFacets = facetCoverages.filter(f => f.covered).length;
    const percentage = totalFacets > 0 ? Math.round((coveredFacets / totalFacets) * 100) : 100;

    // Calculate by type for this feature
    const byType = this.calculateTypeCoverage(facetCoverages);

    // Get feature path (parent of .facet directory)
    const facetDir = dirname(structureFile);
    const featurePath = dirname(facetDir);

    return {
      feature: structure.feature,
      path: featurePath,
      totalFacets,
      coveredFacets,
      percentage,
      byType,
      facets: facetCoverages,
    };
  }

  /**
   * Calculate coverage breakdown by facet type
   */
  private calculateTypeCoverage(facetCoverages: FacetCoverage[]): TypeCoverage[] {
    const typeMap = new Map<string, { total: number; covered: number }>();

    for (const fc of facetCoverages) {
      const type = fc.facet.type;
      const existing = typeMap.get(type) || { total: 0, covered: 0 };
      existing.total++;
      if (fc.covered) {
        existing.covered++;
      }
      typeMap.set(type, existing);
    }

    const result: TypeCoverage[] = [];
    for (const [type, stats] of typeMap) {
      result.push({
        type,
        total: stats.total,
        covered: stats.covered,
        percentage: stats.total > 0 ? Math.round((stats.covered / stats.total) * 100) : 100,
      });
    }

    // Sort by type name
    result.sort((a, b) => a.type.localeCompare(b.type));

    return result;
  }

  /**
   * Check if coverage meets configured thresholds
   */
  checkThresholds(report: CoverageReport): {
    passed: boolean;
    failures: string[];
  } {
    const failures: string[] = [];

    // Check global threshold
    if (report.summary.percentage < this.config.thresholds.global) {
      failures.push(
        `Global coverage ${report.summary.percentage}% is below threshold of ${this.config.thresholds.global}%`
      );
    }

    // Check per-type thresholds
    for (const [type, threshold] of Object.entries(this.config.thresholds.byType)) {
      const typeCoverage = report.byType.find(t => t.type === type);
      if (typeCoverage && typeCoverage.percentage < threshold) {
        failures.push(
          `${type} coverage ${typeCoverage.percentage}% is below threshold of ${threshold}%`
        );
      }
    }

    return {
      passed: failures.length === 0,
      failures,
    };
  }

  /**
   * Get coverage for a specific facet
   */
  async getFacetCoverage(facetId: string, cwd: string = process.cwd()): Promise<FacetCoverage | null> {
    const report = await this.calculateCoverage(cwd);

    for (const feature of report.features) {
      const facetCoverage = feature.facets.find(f => f.facet.id === facetId);
      if (facetCoverage) {
        return facetCoverage;
      }
    }

    return null;
  }
}
