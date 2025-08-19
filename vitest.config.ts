import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    // Look for test files next to source files
    include: ['src/**/*.test.ts'],
  },
});
