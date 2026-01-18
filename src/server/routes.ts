import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { DevServer } from './DevServer.js';

type RouteHandler = (req: Request, params: Record<string, string>) => Promise<Response> | Response;

interface Route {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

// Cached client bundle
let clientBundle: string | null = null;

/**
 * Clear the client bundle cache (for hot reload)
 */
export function clearClientBundleCache(): void {
  clientBundle = null;
}

// Path to client source (relative to package root)
const CLIENT_ENTRY_PATH = 'src/server/client/index.tsx';

/**
 * Build or load the client bundle
 * - Production/installed: use pre-built bundle from dist/client/
 * - Development: build at runtime for hot reload support
 */
async function buildClientBundle(packageRoot: string): Promise<string> {
  if (clientBundle) return clientBundle;

  // Check for pre-built bundle (production/installed package)
  const preBuiltPath = join(packageRoot, 'dist/client/index.js');
  if (existsSync(preBuiltPath)) {
    clientBundle = readFileSync(preBuiltPath, 'utf-8');
    return clientBundle;
  }

  // Development: build at runtime for hot reload
  const entryPoint = join(packageRoot, CLIENT_ENTRY_PATH);

  const result = await Bun.build({
    entrypoints: [entryPoint],
    target: 'browser',
    format: 'esm',
    minify: false, // Disable for debugging
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  });

  if (!result.success) {
    console.error('Client build failed:', result.logs);
    throw new Error('Failed to build client bundle');
  }

  // Read the built file
  const outputFile = result.outputs[0];
  clientBundle = await outputFile.text();
  return clientBundle;
}

/**
 * Get the HTML shell for the SPA
 */
function getHtmlShell(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Facet Coverage</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            slate: {
              850: '#172033',
            }
          }
        }
      }
    }
  </script>
  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: #1e293b; }
    ::-webkit-scrollbar-thumb { background: #475569; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #64748b; }

    /* Code styling */
    code { font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace; }
  </style>
</head>
<body class="dark">
  <div id="app"></div>
  <script type="module" src="/client.js"></script>
</body>
</html>`;
}

/**
 * Simple router for handling HTTP requests
 */

export function createRouter(server: DevServer, packageRoot: string) {
  const routes: Route[] = [];

  function addRoute(pattern: string, handler: RouteHandler) {
    const paramNames: string[] = [];
    const paramMatches = pattern.matchAll(/:([^/]+)/g);
    for (const match of paramMatches) {
      paramNames.push(match[1]);
    }

    const regexPattern = pattern
      .replace(/:[^/]+/g, '([^/]+)')
      .replace(/\//g, '\\/');
    routes.push({
      pattern: new RegExp(`^${regexPattern}$`),
      paramNames,
      handler,
    });
  }

  // Serve client bundle
  addRoute('/client.js', async () => {
    try {
      const bundle = await buildClientBundle(packageRoot);
      return new Response(bundle, {
        headers: { 'Content-Type': 'application/javascript' },
      });
    } catch (err) {
      console.error('Bundle error:', err);
      return new Response('// Bundle error: ' + String(err), {
        status: 500,
        headers: { 'Content-Type': 'application/javascript' },
      });
    }
  });

  // API: Full coverage report
  addRoute('/api/coverage', () => {
    const report = server.getCoverageReport();
    if (!report) {
      return new Response(JSON.stringify({ error: 'Coverage not ready' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return new Response(JSON.stringify(report), {
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // API: Single facet with test details
  addRoute('/api/facet/:id', (_req, params) => {
    const report = server.getCoverageReport();
    if (!report) {
      return new Response(JSON.stringify({ error: 'Coverage not ready' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    for (const feature of report.features) {
      const found = feature.facets.find(fc => fc.facet.id === params.id);
      if (found) {
        return new Response(JSON.stringify(found), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    return new Response(JSON.stringify({ error: 'Facet not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  });

  // API: Test source code
  addRoute('/api/test-source', (req) => {
    const url = new URL(req.url);
    const file = url.searchParams.get('file');
    const lineParam = url.searchParams.get('line');

    if (!file) {
      return new Response(JSON.stringify({ error: 'Missing file parameter' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const filePath = join(server.getCwd(), file);
    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'File not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const line = lineParam ? parseInt(lineParam, 10) : undefined;

      let startLine = 0;
      let endLine = lines.length;
      if (line !== undefined && !isNaN(line)) {
        startLine = Math.max(0, line - 25);
        endLine = Math.min(lines.length, line + 25);
      }

      const excerpt = lines.slice(startLine, endLine).join('\n');

      return new Response(JSON.stringify({
        file,
        code: excerpt,
        startLine: startLine + 1,
        endLine,
        highlightLine: line,
      }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Error reading file' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  // API: Markdown source - handles nested paths via query param
  addRoute('/api/markdown', (req, _params) => {
    const url = new URL(req.url);
    const mdPath = url.searchParams.get('path') || '';
    const report = server.getCoverageReport();
    // Try to find the file in any feature path
    let filePath = join(server.getCwd(), mdPath);

    if (!existsSync(filePath) && report) {
      // Try each feature's path
      for (const feature of report.features) {
        const featurePath = join(feature.path, mdPath);
        if (existsSync(featurePath)) {
          filePath = featurePath;
          break;
        }
      }
    }

    if (!existsSync(filePath)) {
      return new Response(JSON.stringify({ error: 'File not found', tried: filePath }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      return new Response(JSON.stringify({ path: mdPath, content }), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      return new Response(JSON.stringify({ error: 'Error reading file' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  });

  return {
    async handle(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const pathname = url.pathname;

      // Check API routes first
      for (const route of routes) {
        const match = pathname.match(route.pattern);
        if (match) {
          const params: Record<string, string> = {};
          for (let i = 0; i < route.paramNames.length; i++) {
            params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
          }

          const result = route.handler(req, params);
          if (result instanceof Promise) {
            return await result;
          }
          return result;
        }
      }

      // For all other routes, serve the SPA shell
      return new Response(getHtmlShell(), {
        headers: { 'Content-Type': 'text/html' },
      });
    },
  };
}
