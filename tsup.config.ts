import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  clean: true,
  dts: true,
  sourcemap: true,
  minify: false,
  ignoreWatch: ['demo/**/*'],
});
