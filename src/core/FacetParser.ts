import { readFileSync, existsSync } from 'fs';
import type { MarkdownSection, ParsedMarkdown } from '../types.js';

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

    // First pass: find all headings
    const headings: { title: string; level: number; line: number }[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(#{1,6})\s+(.+)$/);

      if (match) {
        headings.push({
          level: match[1].length,
          title: match[2].trim(),
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

      sections.push({
        title: heading.title,
        slug: FacetParser.slugify(heading.title),
        level: heading.level,
        startLine,
        endLine,
        content: sectionContent,
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
   * Extract the filename without extension as a prefix
   */
  static getFilePrefix(filePath: string): string {
    const basename = filePath.split('/').pop() || '';
    return basename.replace(/\.md$/i, '').toLowerCase();
  }

  /**
   * Generate facet ID from file and section
   */
  static generateFacetId(filePath: string, sectionSlug: string): string {
    const prefix = FacetParser.getFilePrefix(filePath);
    return `${prefix}:${sectionSlug}`;
  }
}
