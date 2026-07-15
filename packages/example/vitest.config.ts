import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**'],
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
