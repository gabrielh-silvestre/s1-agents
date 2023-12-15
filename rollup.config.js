const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: 'external',
      strict: true,
    },
  ],
  external: ['openai', '@aws-sdk/client-sns'],
  plugins: [typescript()],
};
