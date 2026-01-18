import type { CoverageReport } from '../../types.js';
import { escapeHtml, getCoverageClass } from './Layout.js';
import { renderSidebar } from './Sidebar.js';

/**
 * Render the dashboard page
 */
export function renderDashboard(report: CoverageReport): string {
  const coverageClass = getCoverageClass(report.summary.percentage);

  // Type breakdown
  const typeCardsHtml = report.byType
    .map(type => {
      const typeClass = getCoverageClass(type.percentage);
      return `
        <div class="type-card">
          <div class="type-header">
            <span class="type-name">${escapeHtml(type.type)}</span>
            <span class="type-percentage ${typeClass}">${type.percentage}%</span>
          </div>
          <div class="coverage-bar">
            <div class="coverage-fill ${typeClass}" style="width: ${type.percentage}%"></div>
          </div>
          <div style="margin-top: 0.5rem; color: var(--color-muted); font-size: 0.8125rem;">
            ${type.covered} / ${type.total} covered
          </div>
        </div>
      `;
    })
    .join('');

  // Feature cards
  const featureCardsHtml = report.features
    .map(feature => {
      const featureClass = getCoverageClass(feature.percentage);
      return `
        <a href="/feature/${encodeURIComponent(feature.feature)}" class="feature-card">
          <div class="feature-name">${escapeHtml(feature.feature)}</div>
          <div class="coverage-bar">
            <div class="coverage-fill ${featureClass}" style="width: ${feature.percentage}%"></div>
          </div>
          <div class="feature-stats">
            <span>${feature.coveredFacets}/${feature.totalFacets} facets</span>
            <span class="badge ${featureClass}">${feature.percentage}%</span>
          </div>
        </a>
      `;
    })
    .join('');

  // Uncovered facets (top 10)
  const uncoveredHtml = report.uncovered.slice(0, 10)
    .map(facet => `
      <a href="/facet/${encodeURIComponent(facet.id)}" class="facet-item uncovered">
        <div class="facet-header">
          <span class="facet-id">${escapeHtml(facet.id)}</span>
          <span class="facet-type">${escapeHtml(facet.type)}</span>
        </div>
        <div class="facet-source">${escapeHtml(facet.source.file)}#${escapeHtml(facet.source.section)}</div>
      </a>
    `)
    .join('');

  return `
    <div class="app">
      ${renderSidebar(report)}

      <main class="main">
        <div class="doc-panel">
          <div class="card">
            <h2>Overall Coverage</h2>
            <div class="stats-grid">
              <div class="stat">
                <div class="stat-value ${coverageClass}">${report.summary.percentage}%</div>
                <div class="stat-label">Coverage</div>
                <div class="coverage-bar">
                  <div class="coverage-fill ${coverageClass}" style="width: ${report.summary.percentage}%"></div>
                </div>
              </div>
              <div class="stat">
                <div class="stat-value">${report.summary.totalFacets}</div>
                <div class="stat-label">Total Facets</div>
              </div>
              <div class="stat">
                <div class="stat-value success">${report.summary.coveredFacets}</div>
                <div class="stat-label">Covered</div>
              </div>
              <div class="stat">
                <div class="stat-value error">${report.summary.uncoveredFacets}</div>
                <div class="stat-label">Uncovered</div>
              </div>
            </div>
          </div>

          ${report.byType.length > 0 ? `
          <div class="card">
            <h2>Coverage by Type</h2>
            <div class="type-grid">
              ${typeCardsHtml}
            </div>
          </div>
          ` : ''}

          <div class="card">
            <h2>Features</h2>
            <div class="feature-grid">
              ${featureCardsHtml}
            </div>
          </div>

          ${report.uncovered.length > 0 ? `
          <div class="card">
            <h2>Uncovered Facets${report.uncovered.length > 10 ? ` (showing 10 of ${report.uncovered.length})` : ''}</h2>
            <div class="facet-list">
              ${uncoveredHtml}
            </div>
          </div>
          ` : ''}
        </div>
      </main>
    </div>
  `;
}
