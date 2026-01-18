/** @jsxImportSource preact */
import type { FacetCoverage, CoverageReport, TestLink } from '../../../types';

interface MarkdownRendererProps {
  markdown: string;
  report: CoverageReport;
  featurePath: string;
  sourceFile: string;
  onFacetClick: (facetId: string, tests: TestLink[]) => void;
  selectedFacetId?: string;
}

interface FacetLookup {
  [shortId: string]: {
    fullId: string;
    coverage: FacetCoverage;
  };
}

export function MarkdownRenderer({
  markdown,
  report,
  featurePath,
  sourceFile,
  onFacetClick,
  selectedFacetId,
}: MarkdownRendererProps) {
  // Build lookup map: shortId -> full facet info
  const facetLookup = buildFacetLookup(report, featurePath, sourceFile);

  // Parse and render markdown with inline coverage badges
  const html = renderMarkdownWithBadges(markdown, facetLookup, selectedFacetId);

  return (
    <div
      class="markdown-content prose prose-invert prose-slate max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        const chip = target.closest('[data-facet-id]') as HTMLElement;
        if (chip) {
          const facetId = chip.dataset.facetId;
          if (facetId && facetLookup[facetId]) {
            const { fullId, coverage } = facetLookup[facetId];
            onFacetClick(fullId, coverage.coveredBy);
          } else if (facetId) {
            // Try to find by full ID directly
            const feature = report.features.find(f => f.path === featurePath);
            const fc = feature?.facets.find(f => f.facet.id === facetId);
            if (fc) {
              onFacetClick(facetId, fc.coveredBy);
            }
          }
        }
      }}
    />
  );
}

function buildFacetLookup(
  report: CoverageReport,
  featurePath: string,
  sourceFile: string
): FacetLookup {
  const lookup: FacetLookup = {};

  // Find the feature
  const feature = report.features.find(f => f.path === featurePath);
  if (!feature) return lookup;

  // Build lookup for facets from this source file
  for (const fc of feature.facets) {
    if (fc.facet.source.file === sourceFile) {
      // Extract the short ID from the full ID
      // Full ID: "features/checkout/compliance:pci-dss/tls"
      // Short ID could be: "pci-dss", "tls", "pci-dss/tls"
      const fullId = fc.facet.id;

      // Get the part after the colon (type:section-path)
      const afterColon = fullId.split(':').pop() || '';

      // Store by multiple keys for flexible lookup
      // 1. By full ID
      lookup[fullId] = { fullId, coverage: fc };

      // 2. By section path (after colon)
      lookup[afterColon] = { fullId, coverage: fc };

      // 3. By just the last segment (for sub-facets)
      const lastSegment = afterColon.split('/').pop() || '';
      if (lastSegment && !lookup[lastSegment]) {
        lookup[lastSegment] = { fullId, coverage: fc };
      }

      // 4. By section slug (from source)
      if (fc.facet.source.section) {
        const sectionKey = fc.facet.source.section;
        if (!lookup[sectionKey]) {
          lookup[sectionKey] = { fullId, coverage: fc };
        }
      }
    }
  }

  return lookup;
}

function renderMarkdownWithBadges(
  markdown: string,
  facetLookup: FacetLookup,
  selectedFacetId?: string
): string {
  let html = markdown;

  // First, convert markdown to HTML (basic conversion)
  html = convertMarkdownToHtml(html);

  // Then, transform facet markers into visible badges

  // Pattern 1: Invisible link anchors [](#id) - these become <a href="#id"></a> in HTML
  // We need to replace them with coverage chips
  html = html.replace(
    /<a href="#([^"]+)"><\/a>/g,
    (match, id) => createCoverageChip(id, facetLookup, selectedFacetId)
  );

  // Pattern 2: Comment markers <!-- @facet:id --> - these might be stripped or preserved
  // Let's also handle the raw pattern in case it wasn't stripped
  html = html.replace(
    /&lt;!-- @facet:(\w+) --&gt;/g,
    (match, id) => createCoverageChip(id, facetLookup, selectedFacetId)
  );

  // Also handle unescaped comments (in case they're preserved)
  html = html.replace(
    /<!-- @facet:(\w+) -->/g,
    (match, id) => createCoverageChip(id, facetLookup, selectedFacetId)
  );

  return html;
}

function createCoverageChip(
  shortId: string,
  facetLookup: FacetLookup,
  selectedFacetId?: string
): string {
  const facetInfo = facetLookup[shortId];

  if (!facetInfo) {
    // Unknown facet - show as gray chip
    return `<span class="facet-chip unknown" data-facet-id="${shortId}" title="Unknown facet: ${shortId}">? ${shortId}</span>`;
  }

  const { fullId, coverage } = facetInfo;
  const testCount = coverage.coveredBy.length;
  const isCovered = coverage.covered;
  const isSelected = selectedFacetId === fullId;

  const statusClass = isCovered ? 'covered' : 'uncovered';
  const selectedClass = isSelected ? 'selected' : '';
  const icon = isCovered ? '✓' : '✗';
  const testText = testCount === 1 ? '1 test' : `${testCount} tests`;

  return `<span class="facet-chip ${statusClass} ${selectedClass}" data-facet-id="${shortId}" title="${fullId}">${icon} ${testText}</span>`;
}

function convertMarkdownToHtml(markdown: string): string {
  let html = markdown;

  // Escape HTML entities first (except for markdown syntax)
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // But preserve the <!-- @facet:id --> pattern for later processing
  html = html.replace(/&lt;!-- @facet:/g, '<!-- @facet:');
  html = html.replace(/ --&gt;/g, ' -->');

  // Convert headings (must be at start of line)
  html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
  html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Convert inline links [text](url) - do this before link anchors
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Convert link anchors [](#id) to empty anchors (will be replaced with chips)
  html = html.replace(/\[\]\(#([^)]+)\)/g, '<a href="#$1"></a>');

  // Convert bold **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert italic *text* (but not inside **)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');

  // Convert inline code `code`
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert code blocks ```lang ... ```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const escapedCode = code.trim();
    return `<pre><code class="language-${lang || 'text'}">${escapedCode}</code></pre>`;
  });

  // Convert horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');

  // Convert unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/^(\s*)- (.+)$/gm, '<li class="ml-4">$2</li>');

  // Convert ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Wrap consecutive list items
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, (match) => {
    const isOrdered = match.includes('1.');
    const tag = isOrdered ? 'ol' : 'ul';
    return `<${tag} class="list-disc ml-6 my-2">${match}</${tag}>`;
  });

  // Convert paragraphs (lines not already converted)
  const lines = html.split('\n');
  const result: string[] = [];
  let inParagraph = false;
  let paragraphContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const isBlockElement =
      trimmed.startsWith('<h') ||
      trimmed.startsWith('<ul') ||
      trimmed.startsWith('<ol') ||
      trimmed.startsWith('<li') ||
      trimmed.startsWith('<pre') ||
      trimmed.startsWith('<hr') ||
      trimmed.startsWith('</ul') ||
      trimmed.startsWith('</ol') ||
      trimmed.startsWith('</pre') ||
      trimmed === '';

    if (isBlockElement) {
      if (inParagraph && paragraphContent.length > 0) {
        result.push(`<p>${paragraphContent.join(' ')}</p>`);
        paragraphContent = [];
        inParagraph = false;
      }
      if (trimmed) {
        result.push(line);
      }
    } else {
      inParagraph = true;
      paragraphContent.push(trimmed);
    }
  }

  // Close any remaining paragraph
  if (paragraphContent.length > 0) {
    result.push(`<p>${paragraphContent.join(' ')}</p>`);
  }

  return result.join('\n');
}
