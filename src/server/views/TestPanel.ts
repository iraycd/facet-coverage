import type { TestLink } from '../../types.js';
import { escapeHtml } from './Layout.js';

/**
 * Render the test panel showing tests that cover a facet
 */
export function renderTestPanel(tests: TestLink[]): string {
  if (tests.length === 0) {
    return `
      <aside class="test-panel">
        <div class="test-panel-header">Tests (0)</div>
        <div class="test-panel-content">
          <div class="empty-state">
            <div class="empty-state-icon">&#128269;</div>
            <p>No tests cover this facet</p>
            <p style="margin-top: 0.5rem; font-size: 0.8125rem;">
              Add a <code>facet()</code> call in your tests to link them.
            </p>
          </div>
        </div>
      </aside>
    `;
  }

  const testsHtml = tests
    .map((test, index) => `
      <div class="test-item${index === 0 ? ' active' : ''}"
           data-file="${escapeHtml(test.file)}"
           data-line="${test.line || ''}">
        <div class="test-file">${escapeHtml(test.file)}</div>
        <div class="test-title">${escapeHtml(test.title)}</div>
        ${test.line ? `<div class="test-line">Line ${test.line}</div>` : ''}
      </div>
    `)
    .join('');

  return `
    <aside class="test-panel">
      <div class="test-panel-header">Tests (${tests.length})</div>
      <div class="test-panel-content">
        <div class="test-list">
          ${testsHtml}
        </div>

        <div id="test-code" style="margin-top: 1rem;">
          ${tests.length > 0 ? renderInitialTestCode(tests[0]) : ''}
        </div>
      </div>
    </aside>
  `;
}

/**
 * Render placeholder for initial test code (will be loaded via JS)
 */
function renderInitialTestCode(test: TestLink): string {
  return `
    <div class="code-block">
      <div class="code-header">
        <span>${escapeHtml(test.file)}</span>
        <button class="copy-btn" onclick="copyToClipboard('bun test ${escapeHtml(test.file)}')">Copy run command</button>
      </div>
      <div class="code-content">
        <div class="empty-state" style="padding: 1rem;">
          Click a test to view source code
        </div>
      </div>
    </div>
  `;
}
