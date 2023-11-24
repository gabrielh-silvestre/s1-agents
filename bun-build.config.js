await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  sourcemap: 'external',
  target: 'node',
  external: ['openai'],
  minify: {
    identifiers: true,
    syntax: true,
    whitespace: false,
  }
});
