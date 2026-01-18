import { readFileSync, existsSync } from 'fs';
import { glob } from 'glob';
import { resolve, relative } from 'path';
import type { TestLink, FacetConfig } from '../types.js';
import { defaultConfig } from '../types.js';

/**
 * Scans test files for facet annotations
 */
export class TestScanner {
  private config: FacetConfig;

  constructor(config: Partial<FacetConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Convert a Facets constant name to a facet ID.
   * Handles hierarchical IDs like:
   * - FEATURES_CORE_PRODUCT_STRUCTURE_READING -> features/core/product:structure-reading
   * - FEATURES_CLI_DX_CLI_ERGONOMICS -> features/cli/dx:cli-ergonomics
   * - PRODUCT_STRUCTURE_READING -> product:structure-reading (legacy)
   */
  private convertConstantToFacetId(constName: string): string {
    // Get facet types from config
    const knownTypes = this.config.facetTypes || [];

    // Split by underscore and lowercase
    const parts = constName.toLowerCase().split('_');

    // Check if it starts with 'features' (hierarchical ID)
    if (parts[0] === 'features' && parts.length > 2) {
      // Find where the type is in the parts
      let typeIndex = -1;
      for (let i = 1; i < parts.length; i++) {
        if (knownTypes.includes(parts[i])) {
          typeIndex = i;
          break;
        }
      }

      if (typeIndex > 1) {
        // Build hierarchical ID: features/path/type:section
        const pathParts = parts.slice(0, typeIndex); // includes 'features' and path
        const type = parts[typeIndex];
        const sectionParts = parts.slice(typeIndex + 1);

        const path = pathParts.join('/');
        const section = sectionParts.join('-');

        return `${path}/${type}:${section}`;
      }
    }

    // Legacy format: PRODUCT_STRUCTURE_READING -> product:structure-reading
    // Find the type at the beginning
    for (const type of knownTypes) {
      if (parts[0] === type) {
        const section = parts.slice(1).join('-');
        return `${type}:${section}`;
      }
    }

    // Fallback: treat first part as type, rest as section
    const type = parts[0];
    const section = parts.slice(1).join('-');
    return `${type}:${section}`;
  }

  /**
   * Find all test files matching configured patterns
   */
  async findTestFiles(cwd: string = process.cwd()): Promise<string[]> {
    const patterns = this.config.testPatterns || ['**/*.spec.ts', '**/*.test.ts'];
    const files: string[] = [];

    // Expand testDir pattern
    const testDirs = await glob(this.config.testDir, { cwd, absolute: true });

    for (const testDir of testDirs) {
      for (const pattern of patterns) {
        const matches = await glob(pattern, { cwd: testDir, absolute: true });
        files.push(...matches);
      }
    }

    // Also search in the testDir pattern directly if it includes globs
    for (const pattern of patterns) {
      const fullPattern = `${this.config.testDir}/${pattern}`;
      const matches = await glob(fullPattern, { cwd, absolute: true });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Scan a single test file for facet annotations
   */
  scanFile(filePath: string, cwd: string = process.cwd()): TestLink[] {
    if (!existsSync(filePath)) {
      throw new Error(`Test file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    return this.scanContent(content, filePath, cwd);
  }

  /**
   * Scan test content for facet annotations
   * Supports multiple annotation styles:
   * - Function call: facet('id1', 'id2') or facet(Facets.ID) inside test body
   * - Playwright: test('name', { annotation: facet('id1', 'id2') }, ...)
   * - Comment: // @facet id1, id2 \n test('name', ...)
   */
  scanContent(content: string, filePath: string, cwd: string = process.cwd()): TestLink[] {
    const testLinks: TestLink[] = [];
    const lines = content.split('\n');

    // Track describe blocks for full title
    const describeStack: string[] = [];

    // Patterns for test definitions
    const testPattern = /(?:test|it)\s*\(\s*(['"`])(.+?)\1\s*,\s*\{/g;
    const testSimplePattern = /(?:test|it)\s*\(\s*(['"`])(.+?)\1\s*,/g;
    const describePattern = /describe\s*\(\s*(['"`])(.+?)\1/g;

    // Pattern for Playwright-style facet annotations
    const facetAnnotationPattern = /annotation\s*:\s*facet\s*\(\s*([^)]+)\s*\)/g;

    // Pattern for facet() function calls inside test body
    // Matches: facet('id'), facet("id"), facet(Facets.ID), facet(Facets.ID, Facets.ID2)
    const facetCallPattern = /^\s*facet\s*\(\s*([^)]+)\s*\)\s*;?\s*$/;

    // Pattern to extract string literals
    const facetIdsPattern = /(['"`])([^'"`]+)\1/g;

    // Pattern to extract Facets.CONSTANT references
    const facetsConstPattern = /Facets\.([A-Z_][A-Z0-9_]*)/g;

    // Pattern for comment-based facet annotations: // @facet id1, id2
    const commentFacetPattern = /^\s*\/\/\s*@facet\s+(.+)$/;

    // Track brace depth for describe blocks and tests
    let braceDepth = 0;
    const describeDepths: number[] = [];

    // Track pending comment-based facet IDs
    let pendingFacetIds: string[] = [];
    let pendingFacetLine = -1;

    // Track current test context for function-call style facets
    let currentTest: { title: string; fullTitle: string; line: number; startBrace: number } | null = null;
    let currentTestFacetIds: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for comment-based facet annotation
      const commentMatch = commentFacetPattern.exec(line);
      if (commentMatch) {
        const facetString = commentMatch[1];
        // Parse comma-separated facet IDs, trimming whitespace
        pendingFacetIds = facetString.split(',').map(id => id.trim()).filter(id => id.length > 0);
        pendingFacetLine = lineNumber;
        continue;
      }

      // Track describe blocks
      const describeMatch = describePattern.exec(line);
      if (describeMatch) {
        describeStack.push(describeMatch[2]);
        describeDepths.push(braceDepth);
        describePattern.lastIndex = 0;
      }

      // Count braces for scope tracking
      const openBraces = (line.match(/\{/g) || []).length;
      const closeBraces = (line.match(/\}/g) || []).length;

      // Check for facet() function call inside current test
      if (currentTest && braceDepth > currentTest.startBrace) {
        const facetCallMatch = facetCallPattern.exec(line);
        if (facetCallMatch) {
          const facetArgs = facetCallMatch[1];

          // Extract string literal facet IDs
          let idMatch;
          while ((idMatch = facetIdsPattern.exec(facetArgs)) !== null) {
            currentTestFacetIds.push(idMatch[2]);
          }
          facetIdsPattern.lastIndex = 0;

          // Extract Facets.CONSTANT references - convert to facet ID format
          while ((idMatch = facetsConstPattern.exec(facetArgs)) !== null) {
            const constName = idMatch[1];
            const facetId = this.convertConstantToFacetId(constName);
            currentTestFacetIds.push(facetId);
          }
          facetsConstPattern.lastIndex = 0;
        }
      }

      braceDepth += openBraces - closeBraces;

      // Pop describe blocks when we exit their scope
      while (describeDepths.length > 0 && braceDepth <= describeDepths[describeDepths.length - 1]) {
        describeStack.pop();
        describeDepths.pop();
      }

      // Check if we're exiting the current test
      if (currentTest && braceDepth <= currentTest.startBrace) {
        // Save the test with collected facet IDs
        if (currentTestFacetIds.length > 0) {
          testLinks.push({
            file: relative(cwd, filePath),
            title: currentTest.title,
            fullTitle: currentTest.fullTitle,
            facetIds: [...new Set(currentTestFacetIds)], // Deduplicate
            line: currentTest.line,
          });
        }
        currentTest = null;
        currentTestFacetIds = [];
      }

      // Look for test definitions
      // First try with annotation block pattern
      let testMatch = testPattern.exec(line);
      testPattern.lastIndex = 0;

      // Also try simple test pattern for comment-based annotations
      if (!testMatch) {
        testMatch = testSimplePattern.exec(line);
        testSimplePattern.lastIndex = 0;
      }

      if (testMatch) {
        const testTitle = testMatch[2];
        let facetIds: string[] = [];

        // Check for pending comment-based facet IDs (within 3 lines)
        if (pendingFacetIds.length > 0 && lineNumber - pendingFacetLine <= 3) {
          facetIds = [...pendingFacetIds];
          pendingFacetIds = [];
          pendingFacetLine = -1;
        } else {
          // Look for Playwright-style facet annotation in the next few lines
          const annotationBlock = lines.slice(i, Math.min(i + 10, lines.length)).join('\n');
          const facetMatch = facetAnnotationPattern.exec(annotationBlock);
          facetAnnotationPattern.lastIndex = 0;

          if (facetMatch) {
            const facetArgs = facetMatch[1];

            let idMatch;
            while ((idMatch = facetIdsPattern.exec(facetArgs)) !== null) {
              facetIds.push(idMatch[2]);
            }
            facetIdsPattern.lastIndex = 0;

            // Also check for Facets.CONSTANT in annotation
            while ((idMatch = facetsConstPattern.exec(facetArgs)) !== null) {
              const constName = idMatch[1];
              const facetId = this.convertConstantToFacetId(constName);
              facetIds.push(facetId);
            }
            facetsConstPattern.lastIndex = 0;
          }
        }

        const fullTitle = [...describeStack, testTitle].join(' > ');

        if (facetIds.length > 0) {
          // Has immediate facet IDs (comment or Playwright annotation)
          testLinks.push({
            file: relative(cwd, filePath),
            title: testTitle,
            fullTitle,
            facetIds,
            line: lineNumber,
          });
        } else {
          // Start tracking for function-call style facets inside the test body
          currentTest = {
            title: testTitle,
            fullTitle,
            line: lineNumber,
            startBrace: braceDepth - openBraces, // The brace level before this line's braces
          };
          currentTestFacetIds = [];
        }
      }

      // Clear pending facet IDs if we've moved too far past them
      if (pendingFacetIds.length > 0 && lineNumber - pendingFacetLine > 3) {
        pendingFacetIds = [];
        pendingFacetLine = -1;
      }
    }

    // Handle case where file ends while still in a test
    if (currentTest && currentTestFacetIds.length > 0) {
      testLinks.push({
        file: relative(cwd, filePath),
        title: currentTest.title,
        fullTitle: currentTest.fullTitle,
        facetIds: [...new Set(currentTestFacetIds)],
        line: currentTest.line,
      });
    }

    return testLinks;
  }

  /**
   * Scan all test files for facet annotations
   */
  async scanAllTests(cwd: string = process.cwd()): Promise<TestLink[]> {
    const files = await this.findTestFiles(cwd);
    const allLinks: TestLink[] = [];

    for (const file of files) {
      try {
        const links = this.scanFile(file, cwd);
        allLinks.push(...links);
      } catch (error) {
        console.warn(`Warning: Could not scan test file ${file}: ${error}`);
      }
    }

    return allLinks;
  }

  /**
   * Get all facet IDs referenced in tests
   */
  async getAllReferencedFacetIds(cwd: string = process.cwd()): Promise<Set<string>> {
    const links = await this.scanAllTests(cwd);
    const ids = new Set<string>();

    for (const link of links) {
      for (const id of link.facetIds) {
        ids.add(id);
      }
    }

    return ids;
  }

  /**
   * Get tests that cover a specific facet ID
   */
  async getTestsForFacet(facetId: string, cwd: string = process.cwd()): Promise<TestLink[]> {
    const links = await this.scanAllTests(cwd);
    return links.filter(link => link.facetIds.includes(facetId));
  }
}
