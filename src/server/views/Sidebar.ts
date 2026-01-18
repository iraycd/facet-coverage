import type { CoverageReport } from '../../types.js';
import { escapeHtml, getCoverageClass } from './Layout.js';

/**
 * Render the sidebar navigation
 */
export function renderSidebar(report: CoverageReport, activeFeature?: string, activeFacet?: string): string {
  const featuresHtml = report.features
    .map(feature => {
      const coverageClass = getCoverageClass(feature.percentage);
      const isActive = feature.feature === activeFeature;

      const facetsHtml = feature.facets
        .map(fc => {
          const facetActive = fc.facet.id === activeFacet;
          const coverStatus = fc.covered ? 'covered' : 'uncovered';
          return `
            <a href="/facet/${encodeURIComponent(fc.facet.id)}"
               class="nav-item ${coverStatus}${facetActive ? ' active' : ''}"
               title="${escapeHtml(fc.facet.id)}">
              ${escapeHtml(fc.facet.id.split(':').pop() || fc.facet.id)}
            </a>
          `;
        })
        .join('');

      return `
        <div class="nav-section">
          <a href="/feature/${encodeURIComponent(feature.feature)}" class="nav-section-header">
            <span class="nav-section-title">${escapeHtml(feature.feature)}</span>
            <span class="nav-section-badge ${coverageClass}">${feature.percentage}%</span>
          </a>
          <div class="nav-items">
            ${facetsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  return `
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
            <span class="nav-section-badge ${getCoverageClass(report.summary.percentage)}">${report.summary.percentage}%</span>
          </a>
        </div>
        ${featuresHtml}
      </nav>
    </aside>
  `;
}
