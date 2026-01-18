/**
 * Pre-build the client bundle for production/installed package usage
 */

const result = await Bun.build({
  entrypoints: ['src/server/client/index.tsx'],
  outdir: 'dist/client',
  target: 'browser',
  format: 'esm',
  minify: true,
  define: {
    'process.env.NODE_ENV': '"production"',
  },
});

if (!result.success) {
  console.error('Client build failed:');
  for (const log of result.logs) {
    console.error(log);
  }
  process.exit(1);
}

console.log('Client bundle built successfully: dist/client/index.js');
