import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { FacetCoverage, FeatureCoverage } from '../../types.js';
import { escapeHtml, getCoverageClass } from './Layout.js';
import { renderTestPanel } from './TestPanel.js';

/**
 * Render a facet detail page with markdown content and tests
 */
export function renderFacetPage(
  facetCoverage: FacetCoverage,
  feature: FeatureCoverage,
  cwd: string
): string {
  const { facet, covered, coveredBy } = facetCoverage;
  const statusClass = covered ? 'success' : 'error';
  const statusText = covered ? 'Covered' : 'Uncovered';

  // Try to read the markdown source
  // The source.file is relative to the feature directory, so use feature.path
  let markdownContent = '';
  const sourceFile = join(feature.path, facet.source.file);
  if (existsSync(sourceFile)) {
    try {
      const content = readFileSync(sourceFile, 'utf-8');
      markdownContent = renderMarkdown(content, facet.source.section);
    } catch {
      markdownContent = '<p class="empty-state">Could not read source file</p>';
    }
  } else {
    markdownContent = '<p class="empty-state">Source file not found</p>';
  }

  return `
    <div class="app">
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1>Facet Docs</h1>
        </div>
        <div class="sidebar-search">
          <input type="text" id="sidebar-search" placeholder="Search facets... (Ctrl+K)" />
        </div>
        <nav class="sidebar-nav">
          <div class="nav-section">
            <a href="/" class="nav-section-header">
              <span class="nav-section-title">Dashboard</span>
            </a>
          </div>
          <div class="nav-section">
            <a href="/feature/${encodeURIComponent(feature.feature)}" class="nav-section-header">
              <span class="nav-section-title">${escapeHtml(feature.feature)}</span>
              <span class="nav-section-badge ${getCoverageClass(feature.percentage)}">${feature.percentage}%</span>
            </a>
            <div class="nav-items">
              ${feature.facets.map(fc => `
                <a href="/facet/${encodeURIComponent(fc.facet.id)}"
                   class="nav-item ${fc.covered ? 'covered' : 'uncovered'}${fc.facet.id === facet.id ? ' active' : ''}"
                   title="${escapeHtml(fc.facet.id)}">
                  ${escapeHtml(fc.facet.id.split(':').pop() || fc.facet.id)}
                </a>
              `).join('')}
            </div>
          </div>
        </nav>
      </aside>

      <main class="main">
        <div class="doc-panel">
          <div class="breadcrumb">
            <a href="/">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <a href="/feature/${encodeURIComponent(feature.feature)}">${escapeHtml(feature.feature)}</a>
            <span class="breadcrumb-separator">/</span>
            <span>${escapeHtml(facet.id)}</span>
          </div>

          <div class="card">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
              <div>
                <h2 style="font-family: monospace; margin-bottom: 0.5rem;">${escapeHtml(facet.id)}</h2>
                <div style="color: var(--color-muted); font-size: 0.875rem;">
                  <span class="facet-type" style="margin-right: 0.5rem;">${escapeHtml(facet.type)}</span>
                  ${escapeHtml(facet.source.file)}#${escapeHtml(facet.source.section)}
                </div>
              </div>
              <span class="badge ${statusClass}">${statusText}</span>
            </div>

            <div class="markdown-content">
              ${markdownContent}
            </div>
          </div>
        </div>

        ${renderTestPanel(coveredBy)}
      </main>
    </div>
  `;
}

/**
 * Simple markdown to HTML converter
 */
function renderMarkdown(content: string, section: string): string {
  // Find the section in the markdown
  const lines = content.split('\n');
  let inSection = false;
  let sectionLines: string[] = [];
  let sectionLevel = 0;

  for (const line of lines) {
    // Check if this is a heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const title = headingMatch[2];
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      if (slug === section || title.toLowerCase().includes(section.toLowerCase())) {
        inSection = true;
        sectionLevel = level;
        sectionLines.push(line);
        continue;
      }

      // End section if we hit a heading of same or higher level
      if (inSection && level <= sectionLevel) {
        break;
      }
    }

    if (inSection) {
      sectionLines.push(line);
    }
  }

  // If we didn't find the section, show all content
  if (sectionLines.length === 0) {
    sectionLines = lines.slice(0, 50); // First 50 lines
    if (lines.length > 50) {
      sectionLines.push('...');
    }
  }

  // Convert markdown to HTML (simple conversion)
  return sectionLines
    .map(line => convertMarkdownLine(line))
    .join('\n');
}

/**
 * Convert a single markdown line to HTML
 */
function convertMarkdownLine(line: string): string {
  // Headings
  const h1 = line.match(/^#\s+(.+)$/);
  if (h1) return `<h1>${escapeHtml(h1[1])}</h1>`;

  const h2 = line.match(/^##\s+(.+)$/);
  if (h2) return `<h2>${escapeHtml(h2[1])}</h2>`;

  const h3 = line.match(/^###\s+(.+)$/);
  if (h3) return `<h3>${escapeHtml(h3[1])}</h3>`;

  const h4 = line.match(/^####\s+(.+)$/);
  if (h4) return `<h4>${escapeHtml(h4[1])}</h4>`;

  // List items
  const ul = line.match(/^[-*]\s+(.+)$/);
  if (ul) return `<li>${formatInline(ul[1])}</li>`;

  const ol = line.match(/^\d+\.\s+(.+)$/);
  if (ol) return `<li>${formatInline(ol[1])}</li>`;

  // Code block markers
  if (line.startsWith('```')) return '';

  // Empty line
  if (line.trim() === '') return '<br>';

  // Paragraph
  return `<p>${formatInline(line)}</p>`;
}

/**
 * Format inline markdown (bold, italic, code, links)
 */
function formatInline(text: string): string {
  let result = escapeHtml(text);

  // Bold
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Italic
  result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');

  // Inline code
  result = result.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Links (but not empty anchor links like [](#id))
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

  // Remove invisible ID anchors [](#id)
  result = result.replace(/\[\]\(#[^)]+\)/g, '');

  return result;
}
