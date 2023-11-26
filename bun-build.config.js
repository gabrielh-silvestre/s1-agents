await Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist/src',
  sourcemap: 'external',
  target: 'node',
  external: ['openai'],
});
