/**
 * CSS styles for the documentation server
 * Based on the HtmlReporter design system
 */
export function getStyles(): string {
  return `
    :root {
      --color-success: #22c55e;
      --color-warning: #eab308;
      --color-error: #ef4444;
      --color-bg: #0f172a;
      --color-card: #1e293b;
      --color-sidebar: #1a2332;
      --color-text: #f1f5f9;
      --color-muted: #94a3b8;
      --color-border: #334155;
      --color-accent: #3b82f6;
      --sidebar-width: 280px;
      --panel-width: 400px;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      height: 100vh;
      overflow: hidden;
    }

    /* Layout */
    .app {
      display: flex;
      height: 100vh;
    }

    .sidebar {
      width: var(--sidebar-width);
      background: var(--color-sidebar);
      border-right: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .sidebar-header h1 {
      font-size: 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .sidebar-search {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--color-border);
    }

    .sidebar-search input {
      width: 100%;
      padding: 0.5rem 0.75rem;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      color: var(--color-text);
      font-size: 0.875rem;
    }

    .sidebar-search input:focus {
      outline: none;
      border-color: var(--color-accent);
    }

    .sidebar-nav {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .nav-section {
      margin-bottom: 0.5rem;
    }

    .nav-section-header {
      display: flex;
      align-items: center;
      padding: 0.5rem;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
    }

    .nav-section-header:hover {
      background: var(--color-card);
    }

    .nav-section-title {
      flex: 1;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .nav-section-badge {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-weight: 600;
    }

    .nav-section-badge.success { background: var(--color-success); color: #000; }
    .nav-section-badge.warning { background: var(--color-warning); color: #000; }
    .nav-section-badge.error { background: var(--color-error); color: #fff; }

    .nav-items {
      padding-left: 1rem;
    }

    .nav-item {
      display: block;
      padding: 0.375rem 0.5rem;
      color: var(--color-muted);
      text-decoration: none;
      font-size: 0.8125rem;
      border-radius: 4px;
      transition: all 0.15s;
    }

    .nav-item:hover {
      background: var(--color-card);
      color: var(--color-text);
    }

    .nav-item.active {
      background: var(--color-accent);
      color: #fff;
    }

    .nav-item.covered::before {
      content: '\\2713';
      margin-right: 0.5rem;
      color: var(--color-success);
    }

    .nav-item.uncovered::before {
      content: '\\2717';
      margin-right: 0.5rem;
      color: var(--color-error);
    }

    /* Main content area */
    .main {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .doc-panel {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      min-width: 0;
    }

    .test-panel {
      width: var(--panel-width);
      background: var(--color-card);
      border-left: 1px solid var(--color-border);
      display: flex;
      flex-direction: column;
      flex-shrink: 0;
    }

    .test-panel-header {
      padding: 1rem;
      border-bottom: 1px solid var(--color-border);
      font-weight: 600;
    }

    .test-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    /* Cards */
    .card {
      background: var(--color-card);
      border-radius: 12px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      border: 1px solid var(--color-border);
    }

    .card h2 {
      margin-bottom: 1rem;
      font-size: 1.25rem;
    }

    /* Coverage stats */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 1rem;
    }

    .stat {
      text-align: center;
      padding: 1rem;
      background: var(--color-bg);
      border-radius: 8px;
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: bold;
    }

    .stat-label {
      color: var(--color-muted);
      font-size: 0.8125rem;
      margin-top: 0.25rem;
    }

    .stat-value.success { color: var(--color-success); }
    .stat-value.warning { color: var(--color-warning); }
    .stat-value.error { color: var(--color-error); }

    /* Coverage bar */
    .coverage-bar {
      height: 6px;
      background: var(--color-border);
      border-radius: 3px;
      overflow: hidden;
      margin-top: 0.5rem;
    }

    .coverage-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .coverage-fill.success { background: var(--color-success); }
    .coverage-fill.warning { background: var(--color-warning); }
    .coverage-fill.error { background: var(--color-error); }

    /* Type grid */
    .type-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
    }

    .type-card {
      padding: 1rem;
      background: var(--color-bg);
      border-radius: 8px;
    }

    .type-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .type-name {
      font-weight: 600;
      text-transform: capitalize;
      font-size: 0.875rem;
    }

    .type-percentage {
      font-weight: bold;
      font-size: 0.875rem;
    }

    /* Feature grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1rem;
    }

    .feature-card {
      padding: 1rem;
      background: var(--color-bg);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s;
      border: 1px solid transparent;
    }

    .feature-card:hover {
      border-color: var(--color-accent);
      transform: translateY(-2px);
    }

    .feature-name {
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .feature-stats {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: var(--color-muted);
      font-size: 0.8125rem;
    }

    /* Facet list */
    .facet-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .facet-item {
      padding: 1rem;
      background: var(--color-bg);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.15s;
      border-left: 3px solid transparent;
    }

    .facet-item:hover {
      background: var(--color-card);
    }

    .facet-item.covered {
      border-left-color: var(--color-success);
    }

    .facet-item.uncovered {
      border-left-color: var(--color-error);
    }

    .facet-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.25rem;
    }

    .facet-id {
      font-family: monospace;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .facet-type {
      font-size: 0.75rem;
      padding: 0.125rem 0.5rem;
      background: var(--color-card);
      border-radius: 4px;
      text-transform: capitalize;
    }

    .facet-source {
      color: var(--color-muted);
      font-size: 0.8125rem;
    }

    /* Test list */
    .test-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .test-item {
      padding: 0.75rem;
      background: var(--color-bg);
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.15s;
    }

    .test-item:hover {
      background: var(--color-border);
    }

    .test-item.active {
      border: 1px solid var(--color-accent);
    }

    .test-file {
      font-size: 0.75rem;
      color: var(--color-muted);
      font-family: monospace;
    }

    .test-title {
      font-weight: 500;
      margin-top: 0.25rem;
      font-size: 0.875rem;
    }

    .test-line {
      font-size: 0.75rem;
      color: var(--color-muted);
      margin-top: 0.25rem;
    }

    /* Code block */
    .code-block {
      background: var(--color-bg);
      border-radius: 8px;
      overflow: hidden;
      margin-top: 1rem;
    }

    .code-header {
      padding: 0.5rem 1rem;
      background: var(--color-border);
      font-family: monospace;
      font-size: 0.75rem;
      color: var(--color-muted);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-content {
      padding: 1rem;
      overflow-x: auto;
      font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', monospace;
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .code-content pre {
      margin: 0;
    }

    .code-line {
      display: flex;
    }

    .code-line-number {
      width: 3rem;
      color: var(--color-muted);
      text-align: right;
      padding-right: 1rem;
      user-select: none;
      flex-shrink: 0;
    }

    .code-line-content {
      flex: 1;
    }

    .code-line.highlight {
      background: rgba(59, 130, 246, 0.2);
      margin: 0 -1rem;
      padding: 0 1rem;
    }

    /* Markdown content */
    .markdown-content h1 { font-size: 1.75rem; margin-bottom: 1rem; }
    .markdown-content h2 { font-size: 1.5rem; margin: 1.5rem 0 0.75rem; }
    .markdown-content h3 { font-size: 1.25rem; margin: 1.25rem 0 0.5rem; }
    .markdown-content h4 { font-size: 1.1rem; margin: 1rem 0 0.5rem; }
    .markdown-content p { margin-bottom: 0.75rem; }
    .markdown-content ul, .markdown-content ol { margin-bottom: 0.75rem; padding-left: 1.5rem; }
    .markdown-content li { margin-bottom: 0.25rem; }
    .markdown-content code {
      background: var(--color-card);
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: monospace;
      font-size: 0.875em;
    }
    .markdown-content pre {
      background: var(--color-card);
      padding: 1rem;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 0.75rem;
    }
    .markdown-content pre code {
      background: none;
      padding: 0;
    }

    /* Badges */
    .badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .badge.success { background: var(--color-success); color: #000; }
    .badge.warning { background: var(--color-warning); color: #000; }
    .badge.error { background: var(--color-error); color: #fff; }

    /* Breadcrumb */
    .breadcrumb {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }

    .breadcrumb a {
      color: var(--color-muted);
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: var(--color-text);
    }

    .breadcrumb-separator {
      color: var(--color-muted);
    }

    /* Status indicator */
    .status-indicator {
      position: fixed;
      bottom: 1rem;
      right: 1rem;
      padding: 0.5rem 1rem;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 8px;
      font-size: 0.8125rem;
      display: none;
      align-items: center;
      gap: 0.5rem;
      z-index: 1000;
    }

    .status-indicator.visible {
      display: flex;
    }

    .status-indicator.updating {
      border-color: var(--color-warning);
    }

    .status-indicator.connected {
      border-color: var(--color-success);
    }

    .spinner {
      width: 14px;
      height: 14px;
      border: 2px solid var(--color-border);
      border-top-color: var(--color-warning);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: var(--color-muted);
    }

    .empty-state-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    /* Copy button */
    .copy-btn {
      padding: 0.25rem 0.5rem;
      background: var(--color-card);
      border: 1px solid var(--color-border);
      border-radius: 4px;
      color: var(--color-muted);
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.15s;
    }

    .copy-btn:hover {
      background: var(--color-border);
      color: var(--color-text);
    }
  `;
}
