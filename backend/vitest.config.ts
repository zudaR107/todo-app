import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: ['dot'],
    sequence: { concurrent: false },
    include: ['src/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
  },
});
