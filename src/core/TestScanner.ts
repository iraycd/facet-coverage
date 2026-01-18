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
   * Supports both Playwright-style annotations and comment-based annotations:
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
    const facetPattern = /annotation\s*:\s*facet\s*\(\s*([^)]+)\s*\)/g;
    const facetIdsPattern = /(['"`])([^'"`]+)\1/g;

    // Pattern for comment-based facet annotations: // @facet id1, id2
    const commentFacetPattern = /^\s*\/\/\s*@facet\s+(.+)$/;

    // Track brace depth for describe blocks
    let braceDepth = 0;
    const describeDepths: number[] = [];

    // Track pending comment-based facet IDs
    let pendingFacetIds: string[] = [];
    let pendingFacetLine = -1;

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
      braceDepth += openBraces - closeBraces;

      // Pop describe blocks when we exit their scope
      while (describeDepths.length > 0 && braceDepth <= describeDepths[describeDepths.length - 1]) {
        describeStack.pop();
        describeDepths.pop();
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
          const facetMatch = facetPattern.exec(annotationBlock);
          facetPattern.lastIndex = 0;

          if (facetMatch) {
            const facetArgs = facetMatch[1];

            let idMatch;
            while ((idMatch = facetIdsPattern.exec(facetArgs)) !== null) {
              facetIds.push(idMatch[2]);
            }
            facetIdsPattern.lastIndex = 0;
          }
        }

        if (facetIds.length > 0) {
          const fullTitle = [...describeStack, testTitle].join(' > ');

          testLinks.push({
            file: relative(cwd, filePath),
            title: testTitle,
            fullTitle,
            facetIds,
            line: lineNumber,
          });
        }
      }

      // Clear pending facet IDs if we've moved too far past them
      if (pendingFacetIds.length > 0 && lineNumber - pendingFacetLine > 3) {
        pendingFacetIds = [];
        pendingFacetLine = -1;
      }
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
