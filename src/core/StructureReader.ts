import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, join } from 'path';
import { glob } from 'glob';
import type { FacetStructure, Facet, FacetConfig, defaultConfig } from '../types.js';

/**
 * Reads and parses facet structure files
 */
export class StructureReader {
  private config: FacetConfig;

  constructor(config: Partial<FacetConfig> = {}) {
    const { defaultConfig } = require('../types.js');
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Find all structure files matching the configured patterns
   */
  async findStructureFiles(cwd: string = process.cwd()): Promise<string[]> {
    const files: string[] = [];

    for (const pattern of this.config.structureFiles) {
      const matches = await glob(pattern, { cwd, absolute: true });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Read and parse a single structure file
   */
  readStructure(filePath: string): FacetStructure {
    if (!existsSync(filePath)) {
      throw new Error(`Structure file not found: ${filePath}`);
    }

    const content = readFileSync(filePath, 'utf-8');
    let structure: FacetStructure;

    try {
      structure = JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON in structure file: ${filePath}`);
    }

    // Validate structure
    this.validateStructure(structure, filePath);

    // Resolve relative paths in facets
    const structureDir = dirname(filePath);
    structure.facets = structure.facets.map(facet => ({
      ...facet,
      source: {
        ...facet.source,
        file: facet.source.file, // Keep relative for portability
      },
    }));

    return structure;
  }

  /**
   * Read all structure files and return combined facets
   */
  async readAllStructures(cwd: string = process.cwd()): Promise<Map<string, FacetStructure>> {
    const files = await this.findStructureFiles(cwd);
    const structures = new Map<string, FacetStructure>();

    for (const file of files) {
      const structure = this.readStructure(file);
      structures.set(file, structure);
    }

    return structures;
  }

  /**
   * Get all facets from all structure files
   */
  async getAllFacets(cwd: string = process.cwd()): Promise<Facet[]> {
    const structures = await this.readAllStructures(cwd);
    const facets: Facet[] = [];

    for (const structure of structures.values()) {
      facets.push(...structure.facets);
    }

    return facets;
  }

  /**
   * Get facet by ID
   */
  async getFacetById(id: string, cwd: string = process.cwd()): Promise<Facet | undefined> {
    const facets = await this.getAllFacets(cwd);
    return facets.find(f => f.id === id);
  }

  /**
   * Resolve the absolute path to a facet's source file
   */
  resolveSourcePath(facet: Facet, structureFilePath: string): string {
    const structureDir = dirname(structureFilePath);
    // Go up one level from .facet directory to get feature directory
    const featureDir = dirname(structureDir);
    return resolve(featureDir, facet.source.file);
  }

  /**
   * Validate structure object
   */
  private validateStructure(structure: FacetStructure, filePath: string): void {
    if (!structure.feature) {
      throw new Error(`Missing 'feature' field in structure file: ${filePath}`);
    }

    if (!Array.isArray(structure.facets)) {
      throw new Error(`Missing or invalid 'facets' array in structure file: ${filePath}`);
    }

    const seenIds = new Set<string>();

    for (const facet of structure.facets) {
      if (!facet.id) {
        throw new Error(`Facet missing 'id' field in structure file: ${filePath}`);
      }

      if (seenIds.has(facet.id)) {
        throw new Error(`Duplicate facet ID '${facet.id}' in structure file: ${filePath}`);
      }
      seenIds.add(facet.id);

      if (!facet.source?.file) {
        throw new Error(`Facet '${facet.id}' missing 'source.file' in structure file: ${filePath}`);
      }

      if (!facet.source?.section) {
        throw new Error(`Facet '${facet.id}' missing 'source.section' in structure file: ${filePath}`);
      }

      if (!facet.type) {
        throw new Error(`Facet '${facet.id}' missing 'type' in structure file: ${filePath}`);
      }
    }
  }
}
