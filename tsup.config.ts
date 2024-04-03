import { defineConfig } from 'tsup';

export default defineConfig((options) => {
  return {
    entry: ['index.ts'],
    format: options.format,
    clean: options.format?.includes('cjs'),
    dts: options.format?.includes('esm'),
    sourcemap: options.format?.includes('esm'),
    minify: options.format?.includes('cjs'),
    ignoreWatch: ['demo/**/*'],
    noExternal: options.format?.includes('cjs') ? ['rehype', 'retext'] : [],
  };
});
