import type { ServerWebSocket } from 'bun';
import type { FacetConfig, CoverageReport } from '../types.js';
import { CoverageCalculator } from '../core/CoverageCalculator.js';
import { HotReloadManager } from './HotReloadManager.js';
import { createRouter, clearClientBundleCache } from './routes.js';

export interface DevServerOptions {
  port: number;
  host: string;
  open: boolean;
  packageRoot: string;
}

export interface WebSocketData {
  id: string;
}

/**
 * Development server for browsing facet documentation with live coverage
 */
export class DevServer {
  private server: ReturnType<typeof Bun.serve> | null = null;
  private hotReload: HotReloadManager;
  private config: FacetConfig;
  private cwd: string;
  private options: DevServerOptions;
  private router: ReturnType<typeof createRouter>;
  private coverageReport: CoverageReport | null = null;

  constructor(config: FacetConfig, cwd: string, options: DevServerOptions) {
    this.config = config;
    this.cwd = cwd;
    this.options = options;
    this.hotReload = new HotReloadManager(config, cwd);
    this.hotReload.setPackageRoot(options.packageRoot);
    this.router = createRouter(this, options.packageRoot);
  }

  /**
   * Get the current coverage report
   */
  getCoverageReport(): CoverageReport | null {
    return this.coverageReport;
  }

  /**
   * Get config
   */
  getConfig(): FacetConfig {
    return this.config;
  }

  /**
   * Get current working directory
   */
  getCwd(): string {
    return this.cwd;
  }

  /**
   * Calculate coverage and update the cached report
   */
  async refreshCoverage(): Promise<CoverageReport> {
    const calculator = new CoverageCalculator(this.config);
    this.coverageReport = await calculator.calculateCoverage(this.cwd);
    return this.coverageReport;
  }

  /**
   * Start the development server
   */
  async start(): Promise<void> {
    // Initial coverage calculation
    console.log('Calculating initial coverage...');
    await this.refreshCoverage();

    const self = this;

    this.server = Bun.serve<WebSocketData>({
      port: this.options.port,
      hostname: this.options.host,

      fetch(req, server) {
        const url = new URL(req.url);

        // Handle WebSocket upgrade
        if (url.pathname === '/ws') {
          const upgraded = server.upgrade(req, {
            data: { id: crypto.randomUUID() },
          });
          if (upgraded) return undefined;
          return new Response('WebSocket upgrade failed', { status: 400 });
        }

        // Handle HTTP requests via router
        return self.router.handle(req);
      },

      websocket: {
        open(ws: ServerWebSocket<WebSocketData>) {
          self.hotReload.addClient(ws);
          ws.send(JSON.stringify({ type: 'connected', data: { timestamp: new Date().toISOString() } }));
        },
        close(ws: ServerWebSocket<WebSocketData>) {
          self.hotReload.removeClient(ws);
        },
        message(_ws: ServerWebSocket<WebSocketData>, _message: string | Buffer) {
          // Client messages not needed for now
        },
      },
    });

    // Start file watching for hot reload
    this.hotReload.start(
      async () => {
        await this.refreshCoverage();
        return this.coverageReport!;
      },
      () => {
        clearClientBundleCache();
        console.log('  Client bundle cache cleared');
      }
    );

    const url = `http://${this.options.host}:${this.options.port}`;
    console.log(`
\x1b[36m\x1b[1m   Facet Documentation Server\x1b[0m

   Local:   ${url}

   Watching for changes...
   Press Ctrl+C to stop.
`);

    // Open browser if requested
    if (this.options.open) {
      const { exec } = await import('child_process');
      const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      exec(`${command} ${url}`);
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    this.hotReload.stop();
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }
}
