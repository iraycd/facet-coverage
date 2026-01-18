import { watch, type FSWatcher } from 'chokidar';
import type { ServerWebSocket } from 'bun';
import type { FacetConfig, CoverageReport } from '../types.js';
import type { WebSocketData } from './DevServer.js';
import { generateCommand } from '../cli/commands/generate.js';

/**
 * Manages WebSocket connections and file watching for hot reload
 */
export class HotReloadManager {
  private watcher: FSWatcher | null = null;
  private clientWatcher: FSWatcher | null = null;
  private clients: Set<ServerWebSocket<WebSocketData>> = new Set();
  private config: FacetConfig;
  private cwd: string;
  private packageRoot: string = '';
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private clientDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private onRefresh: (() => Promise<CoverageReport>) | null = null;
  private onClientChange: (() => void) | null = null;

  constructor(config: FacetConfig, cwd: string) {
    this.config = config;
    this.cwd = cwd;
  }

  setPackageRoot(packageRoot: string): void {
    this.packageRoot = packageRoot;
  }

  /**
   * Add a WebSocket client
   */
  addClient(ws: ServerWebSocket<WebSocketData>): void {
    this.clients.add(ws);
  }

  /**
   * Remove a WebSocket client
   */
  removeClient(ws: ServerWebSocket<WebSocketData>): void {
    this.clients.delete(ws);
  }

  /**
   * Start watching for file changes
   */
  start(onRefresh: () => Promise<CoverageReport>, onClientChange?: () => void): void {
    this.onRefresh = onRefresh;
    this.onClientChange = onClientChange || null;

    // Watch patterns matching facet markdown files and test files
    const watchPatterns = [
      ...this.config.structureFiles,
      'features/**/facets/**/*.md',
      `${this.config.testDir}/**/*.{ts,js,tsx,jsx}`,
    ];

    this.watcher = watch(watchPatterns, {
      cwd: this.cwd,
      ignoreInitial: true,
      persistent: true,
    });

    this.watcher.on('all', (event, path) => {
      this.handleFileChange(event, path);
    });

    // Watch client source files for hot reload
    if (this.packageRoot) {
      const clientPath = `${this.packageRoot}/src/server/client`;
      this.clientWatcher = watch(`${clientPath}/**/*.{ts,tsx,css}`, {
        ignoreInitial: true,
        persistent: true,
      });

      this.clientWatcher.on('all', (event, path) => {
        this.handleClientFileChange(event, path);
      });
    }
  }

  /**
   * Stop watching and clean up
   */
  stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.clientDebounceTimer) {
      clearTimeout(this.clientDebounceTimer);
      this.clientDebounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.clientWatcher) {
      this.clientWatcher.close();
      this.clientWatcher = null;
    }
    this.clients.clear();
  }

  /**
   * Handle file change event with debouncing
   */
  private handleFileChange(event: string, path: string): void {
    // Clear existing timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Notify clients that a change was detected
    this.broadcast({
      type: 'file-change',
      data: { event, path, timestamp: new Date().toISOString() },
    });

    // Check if this is a markdown file (facet definition)
    const isMarkdownChange = path.endsWith('.md');

    // Debounce to avoid multiple rapid refreshes
    this.debounceTimer = setTimeout(async () => {
      console.log(`\n  Change detected: ${path} (${event})`);

      // If markdown changed, regenerate facet structure first
      if (isMarkdownChange) {
        console.log('  Regenerating facet structure...');
        try {
          // Save and restore cwd since generateCommand uses process.cwd()
          const originalCwd = process.cwd();
          process.chdir(this.cwd);
          await generateCommand(undefined, { quiet: true });
          process.chdir(originalCwd);
        } catch (error) {
          console.error('  Error regenerating structure:', error);
        }
      }

      console.log('  Refreshing coverage...');

      if (this.onRefresh) {
        try {
          const report = await this.onRefresh();
          console.log(`  Coverage: ${report.summary.percentage}% (${report.summary.coveredFacets}/${report.summary.totalFacets})`);
          this.broadcast({
            type: 'coverage-update',
            data: {
              timestamp: new Date().toISOString(),
              summary: report.summary,
            },
          });
        } catch (error) {
          console.error('  Error refreshing coverage:', error);
          this.broadcast({
            type: 'error',
            data: { message: String(error), timestamp: new Date().toISOString() },
          });
        }
      }
    }, 300);
  }

  /**
   * Handle client source file change with debouncing
   */
  private handleClientFileChange(event: string, path: string): void {
    // Clear existing timer
    if (this.clientDebounceTimer) {
      clearTimeout(this.clientDebounceTimer);
    }

    // Debounce to avoid multiple rapid rebuilds
    this.clientDebounceTimer = setTimeout(() => {
      console.log(`\n  Client change detected: ${path} (${event})`);
      console.log('  Rebuilding client bundle...');

      // Clear the bundle cache and notify clients to reload
      if (this.onClientChange) {
        this.onClientChange();
      }

      this.broadcast({
        type: 'client-reload',
        data: { timestamp: new Date().toISOString() },
      });
    }, 200);
  }

  /**
   * Broadcast a message to all connected clients
   */
  private broadcast(message: { type: string; data: unknown }): void {
    const json = JSON.stringify(message);
    for (const client of this.clients) {
      try {
        client.send(json);
      } catch {
        // Client may have disconnected
        this.clients.delete(client);
      }
    }
  }
}
