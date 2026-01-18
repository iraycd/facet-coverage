import { existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname, basename, resolve } from 'path';
import { FacetParser } from '../../core/FacetParser.js';
import type { FacetStructure, Facet } from '../../types.js';

interface GenerateOptions {
  output?: string;
  type?: string;
}

/**
 * Generate structure.json from facet markdown files
 */
export async function generateCommand(dir: string, options: GenerateOptions = {}): Promise<void> {
  const facetsDir = resolve(process.cwd(), dir);

  if (!existsSync(facetsDir)) {
    console.error(`❌ Directory not found: ${facetsDir}`);
    process.exit(1);
  }

  console.log(`💎 Generating structure from: ${facetsDir}`);

  // Find all markdown files in the directory
  const files = readdirSync(facetsDir).filter(f => f.endsWith('.md'));

  if (files.length === 0) {
    console.error(`❌ No markdown files found in: ${facetsDir}`);
    process.exit(1);
  }

  const parser = new FacetParser();
  const facets: Facet[] = [];

  for (const file of files) {
    const filePath = join(facetsDir, file);
    const parsed = parser.parseFile(filePath);

    // Determine facet type from filename (e.g., business.md -> business)
    const type = options.type || basename(file, '.md');

    console.log(`  📄 ${file}`);

    for (const section of parsed.sections) {
      // Only include top-level sections (h2 or the first h1 if no h2s)
      if (section.level <= 2) {
        const facetId = FacetParser.generateFacetId(file, section.slug);

        facets.push({
          id: facetId,
          source: {
            file: `facets/${file}`,
            section: section.slug,
          },
          type,
          title: section.title,
        });

        console.log(`    ✓ ${facetId}`);
      }
    }
  }

  // Determine feature name from parent directory
  const featureDir = dirname(facetsDir);
  const featureName = basename(featureDir);

  // Build structure object
  const structure: FacetStructure = {
    feature: featureName,
    facets,
  };

  // Determine output path
  const outputDir = options.output || join(featureDir, '.facet');
  const outputPath = join(outputDir, 'structure.json');

  // Ensure output directory exists
  mkdirSync(outputDir, { recursive: true });

  // Write structure file
  writeFileSync(outputPath, JSON.stringify(structure, null, 2));

  console.log(`\n✅ Generated: ${outputPath}`);
  console.log(`   Feature: ${featureName}`);
  console.log(`   Facets: ${facets.length}`);
}
