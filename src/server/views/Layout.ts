import { getStyles } from './styles.js';
import { getScripts } from './scripts.js';

interface LayoutOptions {
  title?: string;
}

/**
 * Render the main HTML layout shell
 */
export function renderLayout(content: string, options: LayoutOptions = {}): string {
  const title = options.title || 'Facet Documentation';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  ${content}

  <!-- Status indicator for hot reload -->
  <div id="status-indicator" class="status-indicator">
    <div class="spinner"></div>
    <span id="status-text">Connecting...</span>
  </div>

  <script>
    ${getScripts()}
  </script>
</body>
</html>`;
}

/**
 * Escape HTML special characters
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Get CSS class for coverage percentage
 */
export function getCoverageClass(percentage: number): string {
  if (percentage >= 80) return 'success';
  if (percentage >= 50) return 'warning';
  return 'error';
}
