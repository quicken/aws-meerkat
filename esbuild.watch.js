const { build } = require('esbuild');

const config = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'build/index.js',
  minify: false,
  sourcemap: true,
  external: ['@aws-sdk/*', 'aws-lambda'],
  format: 'cjs',
  keepNames: true,
  logLevel: 'info',
  watch: {
    onRebuild(error, result) {
      if (error) console.error('Watch build failed:', error);
      else console.log('Watch build succeeded');
    },
  },
};

build(config).then(() => {
  console.log('Watching for changes...');
}).catch(() => process.exit(1));