import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts'],
    environment: 'node',
  },
  resolve: {
    alias: {
      // Vitest runs on-node, so `.js`-suffixed relative imports (required by the
      // ESM output) must resolve to their `.ts` sources.
      // We rely on vitest's default .js→.ts resolution, no manual alias needed.
    },
  },
})
