const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

module.exports = {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: 'inline',
      strict: true,
    },
  ],
  external: ['ky', 'openai', 'whatsapp-web.js', 'qrcode-terminal'],
  plugins: [typescript()],
};
