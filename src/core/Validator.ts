import { existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type {
  FacetConfig,
  FacetStructure,
  Facet,
  TestLink,
  ValidationResult,
  ValidationError
} from '../types.js';
import { defaultConfig } from '../types.js';
import { StructureReader } from './StructureReader.js';
import { FacetParser } from './FacetParser.js';
import { TestScanner } from './TestScanner.js';

/**
 * Validates facet structures, source files, and test links
 */
export class Validator {
  private config: FacetConfig;
  private structureReader: StructureReader;
  private facetParser: FacetParser;
  private testScanner: TestScanner;

  constructor(config: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.structureReader = new StructureReader(this.config);
    this.facetParser = new FacetParser();
    this.testScanner = new TestScanner(this.config);
  }

  /**
   * Run full validation
   */
  async validate(cwd: string = process.cwd()): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Get all structures
    const structures = await this.structureReader.readAllStructures(cwd);

    // Get all test links
    const testLinks = await this.testScanner.scanAllTests(cwd);

    // Collect all facet IDs
    const allFacetIds = new Set<string>();
    const facetIdToStructureFile = new Map<string, string>();

    for (const [structureFile, structure] of structures) {
      for (const facet of structure.facets) {
        if (allFacetIds.has(facet.id)) {
          errors.push({
            type: 'duplicate-id',
            message: `Duplicate facet ID '${facet.id}' found in multiple structure files`,
            file: structureFile,
            facetId: facet.id,
          });
        }
        allFacetIds.add(facet.id);
        facetIdToStructureFile.set(facet.id, structureFile);
      }
    }

    // Validate each structure
    for (const [structureFile, structure] of structures) {
      const structureErrors = this.validateStructure(structure, structureFile, cwd);
      errors.push(...structureErrors.errors);
      warnings.push(...structureErrors.warnings);
    }

    // Validate test links
    const referencedIds = new Set<string>();
    for (const link of testLinks) {
      for (const facetId of link.facetIds) {
        referencedIds.add(facetId);

        if (!allFacetIds.has(facetId)) {
          // Check if it's a flexible path reference
          const isValidPathRef = this.isValidPathReference(facetId, structures);

          if (!isValidPathRef) {
            warnings.push({
              type: 'orphan-test',
              message: `Test references unknown facet ID '${facetId}'`,
              file: link.file,
              line: link.line,
              facetId,
            });
          }
        }
      }
    }

    // Check for uncovered facets (as warnings)
    for (const facetId of allFacetIds) {
      if (!referencedIds.has(facetId)) {
        const structureFile = facetIdToStructureFile.get(facetId);
        warnings.push({
          type: 'orphan-test',
          message: `Facet '${facetId}' is not covered by any test`,
          file: structureFile,
          facetId,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate a single structure
   */
  validateStructure(
    structure: FacetStructure,
    structureFile: string,
    cwd: string
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    const structureDir = dirname(structureFile);
    const featureDir = dirname(structureDir);

    // Build a set of all facet IDs in this structure for parent validation
    const facetIdsInStructure = new Set(structure.facets.map(f => f.id));

    for (const facet of structure.facets) {
      // Validate source file exists
      if (this.config.validation.requireSourceExists) {
        const sourcePath = resolve(featureDir, facet.source.file);

        if (!existsSync(sourcePath)) {
          errors.push({
            type: 'missing-source',
            message: `Source file not found: ${facet.source.file}`,
            file: structureFile,
            facetId: facet.id,
          });
          continue; // Skip section check if file doesn't exist
        }

        // Validate section exists (only for non-sub-facets, sub-facets reference parent's section)
        if (this.config.validation.requireSectionExists && !facet.isSubFacet) {
          const sectionExists = this.facetParser.sectionExists(sourcePath, facet.source.section);

          if (!sectionExists) {
            errors.push({
              type: 'missing-section',
              message: `Section '${facet.source.section}' not found in ${facet.source.file}`,
              file: structureFile,
              facetId: facet.id,
            });
          }
        }
      }

      // Validate facet ID format
      if (!this.isValidFacetId(facet.id)) {
        warnings.push({
          type: 'invalid-facet-id',
          message: `Facet ID '${facet.id}' uses non-standard format`,
          file: structureFile,
          facetId: facet.id,
        });
      }

      // Validate sub-facet parent relationship
      if (facet.isSubFacet && facet.parentId) {
        if (!facetIdsInStructure.has(facet.parentId)) {
          errors.push({
            type: 'orphan-subfacet',
            message: `Sub-facet '${facet.id}' references non-existent parent '${facet.parentId}'`,
            file: structureFile,
            facetId: facet.id,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if a facet ID is valid
   * Valid formats:
   * - type:section (e.g., "business:guest-purchase-flow")
   * - path/type:section (e.g., "features/cli/product:generate-command")
   * - type:section/sub-id (e.g., "compliance:pci-dss/tls") - sub-facet
   */
  private isValidFacetId(id: string): boolean {
    // Allow alphanumeric, hyphens, underscores, colons, and slashes
    // Format: [path/]*type:section[/sub-id]
    return /^[a-zA-Z0-9/_-]+:[a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)?$/.test(id);
  }

  /**
   * Check if a reference is a valid path-style reference
   * e.g., 'facets/business.md#guest-purchase-flow'
   */
  private isValidPathReference(
    ref: string,
    structures: Map<string, FacetStructure>
  ): boolean {
    // Check for path#section format
    const pathMatch = ref.match(/^(.+\.md)#(.+)$/);
    if (!pathMatch) {
      return false;
    }

    const [, filePath, section] = pathMatch;

    // Check if any facet matches this path reference
    for (const structure of structures.values()) {
      for (const facet of structure.facets) {
        if (
          facet.source.file.endsWith(filePath) &&
          facet.source.section === section
        ) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Quick validation check - returns boolean
   */
  async isValid(cwd: string = process.cwd()): Promise<boolean> {
    const result = await this.validate(cwd);
    return result.valid;
  }
}
