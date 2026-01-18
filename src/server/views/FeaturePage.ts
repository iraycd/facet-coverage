import type { CoverageReport, FeatureCoverage } from '../../types.js';
import { escapeHtml, getCoverageClass } from './Layout.js';
import { renderSidebar } from './Sidebar.js';

/**
 * Render a feature detail page
 */
export function renderFeaturePage(feature: FeatureCoverage, report: CoverageReport): string {
  const coverageClass = getCoverageClass(feature.percentage);

  // Group facets by type
  const facetsByType: Record<string, typeof feature.facets> = {};
  for (const fc of feature.facets) {
    const type = fc.facet.type;
    if (!facetsByType[type]) {
      facetsByType[type] = [];
    }
    facetsByType[type].push(fc);
  }

  // Type sections
  const typeSectionsHtml = Object.entries(facetsByType)
    .map(([type, facets]) => {
      const covered = facets.filter(fc => fc.covered).length;
      const total = facets.length;
      const typePercentage = Math.round((covered / total) * 100);
      const typeClass = getCoverageClass(typePercentage);

      const facetsHtml = facets
        .map(fc => {
          const statusClass = fc.covered ? 'covered' : 'uncovered';
          const testsCount = fc.coveredBy.length;

          return `
            <a href="/facet/${encodeURIComponent(fc.facet.id)}" class="facet-item ${statusClass}">
              <div class="facet-header">
                <span class="facet-id">${fc.covered ? '&#10003;' : '&#10007;'} ${escapeHtml(fc.facet.id)}</span>
                ${testsCount > 0 ? `<span class="badge success">${testsCount} test${testsCount !== 1 ? 's' : ''}</span>` : ''}
              </div>
              <div class="facet-source">${escapeHtml(fc.facet.source.file)}#${escapeHtml(fc.facet.source.section)}</div>
            </a>
          `;
        })
        .join('');

      return `
        <div class="card">
          <h2 style="display: flex; justify-content: space-between; align-items: center;">
            <span style="text-transform: capitalize;">${escapeHtml(type)}</span>
            <span class="badge ${typeClass}">${typePercentage}% (${covered}/${total})</span>
          </h2>
          <div class="facet-list">
            ${facetsHtml}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <div class="app">
      ${renderSidebar(report, feature.feature)}

      <main class="main">
        <div class="doc-panel">
          <div class="breadcrumb">
            <a href="/">Dashboard</a>
            <span class="breadcrumb-separator">/</span>
            <span>${escapeHtml(feature.feature)}</span>
          </div>

          <div class="card">
            <h2 style="display: flex; justify-content: space-between; align-items: center;">
              <span>${escapeHtml(feature.feature)}</span>
              <span class="badge ${coverageClass}">${feature.percentage}%</span>
            </h2>
            <div class="stats-grid" style="margin-top: 1rem;">
              <div class="stat">
                <div class="stat-value ${coverageClass}">${feature.percentage}%</div>
                <div class="stat-label">Coverage</div>
              </div>
              <div class="stat">
                <div class="stat-value">${feature.totalFacets}</div>
                <div class="stat-label">Total Facets</div>
              </div>
              <div class="stat">
                <div class="stat-value success">${feature.coveredFacets}</div>
                <div class="stat-label">Covered</div>
              </div>
              <div class="stat">
                <div class="stat-value error">${feature.totalFacets - feature.coveredFacets}</div>
                <div class="stat-label">Uncovered</div>
              </div>
            </div>
          </div>

          ${typeSectionsHtml}
        </div>
      </main>
    </div>
  `;
}
