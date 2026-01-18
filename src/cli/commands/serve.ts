import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { DevServer } from '../../server/index.js';
import { loadConfig } from '../utils/config.js';

interface ServeOptions {
  port?: string;
  host?: string;
  config?: string;
  open?: boolean;
}

/**
 * Find the facet-coverage package root
 */
function findPackageRoot(): string {
  // Start from the directory of this file and go up to find package.json
  let dir = dirname(dirname(dirname(__dirname))); // Go up from cli/commands to root

  // For development: check if we're in the source tree
  if (existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'src/server/client'))) {
    return dir;
  }

  // For installed package: find from node_modules
  dir = dirname(__dirname);
  while (dir !== '/' && dir !== '.') {
    if (existsSync(join(dir, 'package.json'))) {
      const pkgPath = join(dir, 'package.json');
      try {
        const pkg = require(pkgPath);
        if (pkg.name === '@facet-coverage/core') {
          return dir;
        }
      } catch {
        // Continue searching
      }
    }
    dir = dirname(dir);
  }

  // Fallback: assume running from repo root
  return process.cwd();
}

/**
 * Start the documentation server with hot reload
 */
export async function serveCommand(options: ServeOptions = {}): Promise<void> {
  const cwd = process.cwd();

  // Load config
  const config = await loadConfig(options.config, cwd);

  // Find the package root (where client source is)
  const packageRoot = findPackageRoot();

  // Parse port
  const port = options.port ? parseInt(options.port, 10) : 3000;
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error('Invalid port number');
    process.exit(1);
  }

  const host = options.host || 'localhost';
  const open = options.open ?? false;

  console.log('\n   Facet Documentation Server\n');

  // Create and start server
  const server = new DevServer(config, cwd, { port, host, open, packageRoot });

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\n\n   Stopping server...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await server.stop();
    process.exit(0);
  });

  try {
    await server.start();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
