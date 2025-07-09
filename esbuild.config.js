const { build } = require('esbuild');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'build/index.js',
  minify: true,
  sourcemap: false,
  external: [
    // AWS SDK v3 is available in Lambda runtime
    '@aws-sdk/*',
    'aws-lambda'
  ],
  format: 'cjs',
  keepNames: true,
  metafile: true,
  logLevel: 'info'
};

build(config).catch(() => process.exit(1));