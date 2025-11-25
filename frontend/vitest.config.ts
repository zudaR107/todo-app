import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    reporters: ['dot'],
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});