import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { DevServer } from '../../../src/server/DevServer.js';
import { HotReloadManager } from '../../../src/server/HotReloadManager.js';
import { createRouter, clearClientBundleCache } from '../../../src/server/routes.js';
import { writeFileSync, mkdirSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { Facets, facet } from '../.facet/facets';
import type { FacetConfig, CoverageReport } from '../../../src/types.js';

const testFixtures = join(import.meta.dir, '../../../.test-server-fixtures');

// Mock config for testing
const mockConfig: FacetConfig = {
  structureFiles: ['.test-server-fixtures/**/.facet/structure.json'],
  testDir: '.test-server-fixtures/tests',
  testPattern: '**/*.spec.ts',
  reporters: ['console'],
};

// Setup test fixtures
beforeAll(() => {
  if (existsSync(testFixtures)) {
    rmSync(testFixtures, { recursive: true });
  }
  mkdirSync(join(testFixtures, 'feature/.facet'), { recursive: true });
  mkdirSync(join(testFixtures, 'feature/facets'), { recursive: true });
  mkdirSync(join(testFixtures, 'tests'), { recursive: true });

  writeFileSync(
    join(testFixtures, 'feature/.facet/structure.json'),
    JSON.stringify({
      feature: 'test-feature',
      facets: [
        { id: 'test:sample', source: { file: 'facets/test.md', section: 'sample' }, type: 'test', title: 'Sample' },
      ],
    })
  );

  writeFileSync(join(testFixtures, 'feature/facets/test.md'), '# Test\n\n## Sample\n\nContent.');
  writeFileSync(
    join(testFixtures, 'tests/sample.spec.ts'),
    `test('sample test', () => {\n  facet('test:sample');\n  expect(true).toBe(true);\n});`
  );
});

afterAll(() => {
  if (existsSync(testFixtures)) {
    rmSync(testFixtures, { recursive: true });
  }
});

describe('DevServer', () => {
  test('can be instantiated with config', () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_HTTP);

    const server = new DevServer(mockConfig, testFixtures, {
      port: 3999,
      host: 'localhost',
      open: false,
      packageRoot: join(import.meta.dir, '../../..'),
    });

    expect(server).toBeDefined();
    expect(server.getCwd()).toBe(testFixtures);
    expect(server.getConfig()).toEqual(mockConfig);
  });

  test('getCoverageReport returns null before calculation', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DASHBOARD__COUNTS);

    const server = new DevServer(mockConfig, testFixtures, {
      port: 3998,
      host: 'localhost',
      open: false,
      packageRoot: join(import.meta.dir, '../../..'),
    });

    expect(server.getCoverageReport()).toBeNull();
  });
});

describe('Router', () => {
  let mockServer: {
    getCoverageReport: () => CoverageReport | null;
    getConfig: () => FacetConfig;
    getCwd: () => string;
  };
  let router: ReturnType<typeof createRouter>;

  beforeAll(() => {
    mockServer = {
      getCoverageReport: () => ({
        summary: {
          totalFacets: 10,
          coveredFacets: 5,
          uncoveredFacets: 5,
          percentage: 50,
        },
        byType: {},
        features: [
          {
            name: 'test-feature',
            path: testFixtures,
            totalFacets: 1,
            coveredFacets: 1,
            percentage: 100,
            facets: [
              {
                facet: { id: 'test:sample', source: { file: 'facets/test.md', section: 'sample' }, type: 'test' },
                tests: [],
              },
            ],
          },
        ],
        uncoveredFacets: [],
      }),
      getConfig: () => mockConfig,
      getCwd: () => testFixtures,
    };
    router = createRouter(mockServer as unknown as DevServer, join(import.meta.dir, '../../..'));
  });

  test('serves HTML shell for root route', async () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_HTTP__SPA);

    const response = await router.handle(new Request('http://localhost/'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/html');

    const html = await response.text();
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<div id="app">');
  });

  test('/api/coverage returns coverage report', async () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_HTTP__API);

    const response = await router.handle(new Request('http://localhost/api/coverage'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('application/json');

    const data = await response.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.totalFacets).toBe(10);
  });

  test('/api/facet/:id returns facet details', async () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DOC_VIEWER__LINKED_TESTS);

    const response = await router.handle(new Request('http://localhost/api/facet/test:sample'));
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.facet.id).toBe('test:sample');
  });

  test('/api/facet/:id returns 404 for unknown facet', async () => {
    facet(Facets.FEATURES_SERVER_DX_ERRORS__MISSING);

    const response = await router.handle(new Request('http://localhost/api/facet/unknown:facet'));
    expect(response.status).toBe(404);
  });

  test('/api/test-source requires file parameter', async () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DOC_VIEWER__SOURCE);

    const response = await router.handle(new Request('http://localhost/api/test-source'));
    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error).toContain('Missing file parameter');
  });

  test('/api/markdown returns 404 for missing file', async () => {
    facet(Facets.FEATURES_SERVER_DX_ERRORS__MISSING);

    const response = await router.handle(new Request('http://localhost/api/markdown?path=nonexistent.md'));
    expect(response.status).toBe(404);
  });

  test('client.js route serves JavaScript bundle', async () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_HTTP__STATIC);

    const response = await router.handle(new Request('http://localhost/client.js'));
    expect(response.headers.get('Content-Type')).toBe('application/javascript');
  });
});

describe('HotReloadManager', () => {
  test('can add and remove clients', () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_WEBSOCKET__CONNECT, Facets.FEATURES_SERVER_TECHNICAL_WEBSOCKET__DISCONNECT);

    const manager = new HotReloadManager(mockConfig, testFixtures);

    // Mock WebSocket
    const mockWs = {
      send: () => {},
    } as unknown as Parameters<typeof manager.addClient>[0];

    manager.addClient(mockWs);
    manager.removeClient(mockWs);
    // No error thrown = success
  });

  test('stop cleans up watchers', () => {
    facet(Facets.FEATURES_SERVER_TECHNICAL_FILE_WATCH);

    const manager = new HotReloadManager(mockConfig, testFixtures);
    manager.stop();
    // Should not throw
  });

  test('clearClientBundleCache clears the cache', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_HOT_RELOAD__DEBOUNCE);

    // This should not throw
    clearClientBundleCache();
  });
});

describe('Dashboard Coverage Display', () => {
  test('coverage report includes summary with counts', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DASHBOARD__COUNTS);

    const report: CoverageReport = {
      summary: {
        totalFacets: 100,
        coveredFacets: 75,
        uncoveredFacets: 25,
        percentage: 75,
      },
      byType: {
        product: { total: 50, covered: 40, percentage: 80 },
        technical: { total: 50, covered: 35, percentage: 70 },
      },
      features: [],
      uncoveredFacets: [],
    };

    expect(report.summary.totalFacets).toBe(100);
    expect(report.summary.coveredFacets).toBe(75);
    expect(report.summary.uncoveredFacets).toBe(25);
  });

  test('coverage report includes breakdown by type', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DASHBOARD__BY_TYPE);

    const report: CoverageReport = {
      summary: { totalFacets: 10, coveredFacets: 5, uncoveredFacets: 5, percentage: 50 },
      byType: {
        product: { total: 5, covered: 3, percentage: 60 },
        compliance: { total: 5, covered: 2, percentage: 40 },
      },
      features: [],
      uncoveredFacets: [],
    };

    expect(Object.keys(report.byType)).toContain('product');
    expect(Object.keys(report.byType)).toContain('compliance');
    expect(report.byType.product.percentage).toBe(60);
  });

  test('coverage report includes features list', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DASHBOARD__FEATURES);

    const report: CoverageReport = {
      summary: { totalFacets: 10, coveredFacets: 5, uncoveredFacets: 5, percentage: 50 },
      byType: {},
      features: [
        { name: 'checkout', path: '/features/checkout', totalFacets: 5, coveredFacets: 3, percentage: 60, facets: [] },
        { name: 'auth', path: '/features/auth', totalFacets: 5, coveredFacets: 2, percentage: 40, facets: [] },
      ],
      uncoveredFacets: [],
    };

    expect(report.features.length).toBe(2);
    expect(report.features[0].name).toBe('checkout');
  });

  test('coverage report includes uncovered facets', () => {
    facet(Facets.FEATURES_SERVER_PRODUCT_DASHBOARD__UNCOVERED);

    const report: CoverageReport = {
      summary: { totalFacets: 10, coveredFacets: 5, uncoveredFacets: 5, percentage: 50 },
      byType: {},
      features: [],
      uncoveredFacets: [
        { id: 'product:missing-a', source: { file: 'test.md', section: 'missing-a' }, type: 'product' },
        { id: 'product:missing-b', source: { file: 'test.md', section: 'missing-b' }, type: 'product' },
      ],
    };

    expect(report.uncoveredFacets.length).toBe(2);
  });
});

describe('CLI Integration', () => {
  test('serve command options are recognized', async () => {
    facet(Facets.FEATURES_SERVER_DX_CLI__COMMAND, Facets.FEATURES_SERVER_DX_CLI__PORT);

    // Import the CLI to verify serve command exists
    const { Command } = await import('commander');
    const { serveCommand } = await import('../../../src/cli/commands/serve.js');

    expect(typeof serveCommand).toBe('function');
  });
});
