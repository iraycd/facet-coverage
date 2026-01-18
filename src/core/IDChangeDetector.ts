import { readFileSync, existsSync } from 'fs';
import type { Facet, FacetStructure, TestLink } from '../types.js';
import type { TestScanner } from './TestScanner.js';

/**
 * Represents a single ID change
 */
export interface IDChange {
  /** Type of change */
  type: 'added' | 'removed' | 'renamed';
  /** Old facet ID (for removed/renamed) */
  oldId?: string;
  /** New facet ID (for added/renamed) */
  newId?: string;
  /** Source file */
  file: string;
  /** Section slug */
  section: string;
  /** Facet title */
  title: string;
}

/**
 * Report of all ID changes detected
 */
export interface IDChangeReport {
  /** Whether any changes were detected */
  hasChanges: boolean;
  /** Newly added facet IDs */
  added: IDChange[];
  /** Removed facet IDs */
  removed: IDChange[];
  /** Renamed facet IDs (heading changed but same source location) */
  renamed: IDChange[];
}

/**
 * Detects changes in facet IDs between generate runs
 */
export class IDChangeDetector {
  /**
   * Compare new facets with existing structure.json and detect changes
   */
  static detectChanges(existingPath: string, newFacets: Facet[]): IDChangeReport {
    const report: IDChangeReport = {
      hasChanges: false,
      added: [],
      removed: [],
      renamed: [],
    };

    // If no existing file, all facets are new (but don't report as changes for first-time generation)
    if (!existsSync(existingPath)) {
      return report;
    }

    let existing: FacetStructure;
    try {
      existing = JSON.parse(readFileSync(existingPath, 'utf-8'));
    } catch {
      // If we can't read/parse existing file, treat as first-time generation
      return report;
    }

    // Build maps for comparison
    // Key by ID for direct ID comparison
    const existingById = new Map<string, Facet>();
    // Key by source location (file#section) to detect renames
    const existingBySource = new Map<string, Facet>();

    for (const facet of existing.facets) {
      existingById.set(facet.id, facet);
      const sourceKey = `${facet.source.file}#${facet.source.section}`;
      existingBySource.set(sourceKey, facet);
    }

    const newById = new Map<string, Facet>();
    const newBySource = new Map<string, Facet>();

    for (const facet of newFacets) {
      newById.set(facet.id, facet);
      const sourceKey = `${facet.source.file}#${facet.source.section}`;
      newBySource.set(sourceKey, facet);
    }

    // Detect removed and renamed facets
    for (const [id, facet] of existingById) {
      if (!newById.has(id)) {
        // ID no longer exists - check if it was renamed
        const sourceKey = `${facet.source.file}#${facet.source.section}`;
        const newFacet = newBySource.get(sourceKey);

        if (newFacet && newFacet.id !== id) {
          // Same source location but different ID = renamed (heading changed)
          report.renamed.push({
            type: 'renamed',
            oldId: id,
            newId: newFacet.id,
            file: facet.source.file,
            section: facet.source.section,
            title: newFacet.title || '',
          });
        } else if (!newFacet) {
          // Source location also gone = removed
          report.removed.push({
            type: 'removed',
            oldId: id,
            file: facet.source.file,
            section: facet.source.section,
            title: facet.title || '',
          });
        }
      }
    }

    // Detect added facets (excluding those that were renames)
    const renamedNewIds = new Set(report.renamed.map(r => r.newId));
    for (const [id, facet] of newById) {
      if (!existingById.has(id) && !renamedNewIds.has(id)) {
        report.added.push({
          type: 'added',
          newId: id,
          file: facet.source.file,
          section: facet.source.section,
          title: facet.title || '',
        });
      }
    }

    report.hasChanges =
      report.added.length > 0 ||
      report.removed.length > 0 ||
      report.renamed.length > 0;

    return report;
  }

  /**
   * Find tests that reference changed/removed facet IDs
   */
  static async findAffectedTests(
    changes: IDChangeReport,
    scanner: TestScanner,
    cwd: string
  ): Promise<Map<string, TestLink[]>> {
    const affected = new Map<string, TestLink[]>();

    // Only check removed and renamed (old) IDs
    const changedIds = [
      ...changes.removed.map(c => c.oldId!),
      ...changes.renamed.map(c => c.oldId!),
    ];

    for (const id of changedIds) {
      const tests = await scanner.getTestsForFacet(id, cwd);
      if (tests.length > 0) {
        affected.set(id, tests);
      }
    }

    return affected;
  }

  /**
   * Format a change report for console output
   */
  static formatReport(report: IDChangeReport): string[] {
    const lines: string[] = [];

    if (report.renamed.length > 0) {
      lines.push('\n    Renamed (tests may break):');
      for (const change of report.renamed) {
        lines.push(`      ${change.oldId} → ${change.newId}`);
        if (change.title) {
          lines.push(`        Title: "${change.title}"`);
        }
        // Extract the section part after the colon for the hint
        const oldSection = change.oldId?.split(':')[1] || change.section;
        lines.push(`        💡 To keep old ID: Add {#${oldSection}} to heading`);
      }
    }

    if (report.removed.length > 0) {
      lines.push('\n    Removed:');
      for (const change of report.removed) {
        lines.push(`      - ${change.oldId}`);
      }
    }

    if (report.added.length > 0) {
      lines.push('\n    Added:');
      for (const change of report.added) {
        lines.push(`      + ${change.newId}`);
      }
    }

    return lines;
  }
}
