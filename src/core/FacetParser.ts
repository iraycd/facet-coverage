import { readFileSync, existsSync } from 'fs';
import { dirname, relative } from 'path';
import type { MarkdownSection, ParsedMarkdown, SubFacetMarker } from '../types.js';

/**
 * Parses markdown files and extracts sections
 */
export class FacetParser {
  /**
   * Convert a title to a URL-friendly slug
   */
  static slugify(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Parse sub-facet markers from content lines.
   * Supports two patterns:
   * 1. Comment markers: `<!-- @facet:sub-id -->`
   * 2. Empty link anchors: `[](#sub-id)` - renders invisibly in markdown
   *
   * @param lines - Array of content lines
   * @param startLineNumber - The 1-indexed line number of the first line in the array
   * @returns Array of SubFacetMarker objects
   */
  static parseSubFacets(lines: string[], startLineNumber: number): SubFacetMarker[] {
    const subFacets: SubFacetMarker[] = [];

    // Pattern for comment markers: <!-- @facet:id --> or <!-- @facet: id -->
    const commentPattern = /<!--\s*@facet:\s*([a-z0-9-]+)\s*-->/g;

    // Pattern for empty link anchors: [](#id) or []( #id ) with optional whitespace
    const emptyLinkPattern = /\[\]\(\s*#([a-z0-9-]+)\s*\)/g;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = startLineNumber + i;

      // Check for comment markers (can have multiple per line)
      let commentMatch;
      while ((commentMatch = commentPattern.exec(line)) !== null) {
        subFacets.push({
          id: commentMatch[1],
          line: lineNumber,
          type: 'comment',
        });
      }
      commentPattern.lastIndex = 0;

      // Check for empty link anchors (can have multiple per line)
      let linkMatch;
      while ((linkMatch = emptyLinkPattern.exec(line)) !== null) {
        subFacets.push({
          id: linkMatch[1],
          line: lineNumber,
          type: 'link',
        });
      }
      emptyLinkPattern.lastIndex = 0;
    }

    return subFacets;
  }

  /**
   * Parse a markdown file and extract all sections
   */
  parseFile(filePath: string): ParsedMarkdown {
    if (!existsSync(filePath)) {
      throw new Error(`Markdown file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    return this.parseContent(content, filePath);
  }

  /**
   * Parse markdown content and extract sections
   */
  parseContent(content: string, filePath: string = ''): ParsedMarkdown {
    const lines = content.split('\n');
    const sections: MarkdownSection[] = [];

    // Pattern for standalone explicit ID anchor: [](#id) on its own line
    const explicitIdPattern = /^\s*\[\]\(\s*#([a-z0-9-]+)\s*\)\s*$/;

    // First pass: find all headings
    const headings: { title: string; level: number; line: number; explicitId?: string }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Match heading
      const match = line.match(/^(#{1,6})\s+(.+?)\s*$/);

      if (match) {
        // Check if the next non-empty line is an explicit ID anchor
        let explicitId: string | undefined;
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j];
          if (nextLine.trim() === '') continue; // Skip empty lines
          const idMatch = nextLine.match(explicitIdPattern);
          if (idMatch) {
            explicitId = idMatch[1];
          }
          break; // Only check the first non-empty line after heading
        }

        headings.push({
          level: match[1].length,
          title: match[2].trim(),
          explicitId,
          line: i + 1, // 1-indexed
        });
      }
    }

    // Second pass: create sections with content
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];

      const startLine = heading.line;
      const endLine = nextHeading ? nextHeading.line - 1 : lines.length;

      // Extract content between headings
      const contentLines = lines.slice(startLine, endLine - 1);
      const sectionContent = contentLines.join('\n').trim();

      // Parse sub-facets from section content
      // Content starts at line after heading (startLine is the heading itself)
      let subFacets = FacetParser.parseSubFacets(contentLines, startLine + 1);

      // Use explicit ID if provided, otherwise generate from title
      const slug = heading.explicitId || FacetParser.slugify(heading.title);

      // If heading has explicit ID, filter it out from sub-facets (it was used for heading slug)
      if (heading.explicitId) {
        subFacets = subFacets.filter(sf => sf.id !== heading.explicitId);
      }

      sections.push({
        title: heading.title,
        slug,
        level: heading.level,
        startLine,
        endLine,
        content: sectionContent,
        explicitId: heading.explicitId,
        subFacets: subFacets.length > 0 ? subFacets : undefined,
      });
    }

    return {
      file: filePath,
      sections,
    };
  }

  /**
   * Find a section by its slug
   */
  findSection(parsed: ParsedMarkdown, slug: string): MarkdownSection | undefined {
    return parsed.sections.find(s => s.slug === slug);
  }

  /**
   * Check if a section exists in a file
   */
  sectionExists(filePath: string, sectionSlug: string): boolean {
    try {
      const parsed = this.parseFile(filePath);
      return this.findSection(parsed, sectionSlug) !== undefined;
    } catch {
      return false;
    }
  }

  /**
   * Get all section slugs from a file
   */
  getSectionSlugs(filePath: string): string[] {
    const parsed = this.parseFile(filePath);
    return parsed.sections.map(s => s.slug);
  }

  /**
   * Check if a file uses the .facet.md naming convention
   */
  static isFacetMdFile(filePath: string): boolean {
    return filePath.toLowerCase().endsWith('.facet.md');
  }

  /**
   * Extract the filename without extension as a prefix.
   * Handles both naming conventions:
   * - business.facet.md -> "business"
   * - business.md -> "business"
   */
  static getFilePrefix(filePath: string): string {
    const basename = filePath.split('/').pop() || '';
    if (FacetParser.isFacetMdFile(filePath)) {
      return basename.replace(/\.facet\.md$/i, '').toLowerCase();
    }
    return basename.replace(/\.md$/i, '').toLowerCase();
  }

  /**
   * Generate facet ID from file and section
   */
  static generateFacetId(filePath: string, sectionSlug: string): string {
    const prefix = FacetParser.getFilePrefix(filePath);
    return `${prefix}:${sectionSlug}`;
  }

  /**
   * Generate hierarchical facet ID that includes the path from root.
   * Used for nested feature structures.
   *
   * @param rootDir - The root features directory
   * @param facetFile - The facet markdown file path
   * @param sectionSlug - The section slug
   * @returns ID like "checkout/payments/pci:section-slug" or "business:section-slug"
   */
  static generateHierarchicalFacetId(
    rootDir: string,
    facetFile: string,
    sectionSlug: string
  ): string {
    // Get the directory containing the facet file
    const facetDir = dirname(facetFile);

    // Calculate relative path from root
    let relativePath = relative(rootDir, facetDir);

    // Remove 'facets' directory from the path if present
    relativePath = relativePath
      .split('/')
      .filter((p: string) => p !== 'facets' && p !== '.')
      .join('/');

    const prefix = FacetParser.getFilePrefix(facetFile);

    if (relativePath) {
      return `${relativePath}/${prefix}:${sectionSlug}`;
    }
    return `${prefix}:${sectionSlug}`;
  }

  /**
   * Generate a sub-facet ID from a parent facet ID and sub-facet marker ID.
   * Creates hierarchical ID like "type:parent/child"
   *
   * @param parentFacetId - The parent facet ID (e.g., "compliance:pci-dss")
   * @param subFacetId - The local sub-facet ID from marker (e.g., "tls")
   * @returns Combined ID like "compliance:pci-dss/tls"
   */
  static generateSubFacetId(parentFacetId: string, subFacetId: string): string {
    return `${parentFacetId}/${subFacetId}`;
  }

  /**
   * Check if a facet ID is a sub-facet (contains "/" after the ":")
   *
   * @param facetId - The facet ID to check
   * @returns true if this is a sub-facet ID
   */
  static isSubFacetId(facetId: string): boolean {
    const colonIndex = facetId.indexOf(':');
    if (colonIndex === -1) return false;
    return facetId.indexOf('/', colonIndex) !== -1;
  }

  /**
   * Extract parent facet ID from a sub-facet ID
   *
   * @param subFacetId - The sub-facet ID (e.g., "compliance:pci-dss/tls")
   * @returns The parent ID (e.g., "compliance:pci-dss") or null if not a sub-facet
   */
  static getParentFacetId(subFacetId: string): string | null {
    const colonIndex = subFacetId.indexOf(':');
    if (colonIndex === -1) return null;

    const slashIndex = subFacetId.indexOf('/', colonIndex);
    if (slashIndex === -1) return null;

    return subFacetId.substring(0, slashIndex);
  }
}
