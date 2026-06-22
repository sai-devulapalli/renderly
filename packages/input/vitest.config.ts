import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
      exclude: ['src/index.ts'],
      thresholds: {
        branches: 100,
        lines: 85,
        functions: 85,
        statements: 85,
      },
      reporter: ['text', 'lcov'],
    },
  },
});
