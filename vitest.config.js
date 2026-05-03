// =============================================================================
// Vitest configuration — isolated from vite.config.js to avoid loading the full
// FLS template build pipeline (PHP, SCSS, plugins). Tests target pure JS utils
// and a small subset of DOM-aware code that needs jsdom.
// =============================================================================

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  // We deliberately do NOT extend the project's vite.config.js — that file
  // pulls in heavy plugins, sets root: ./src, and depends on the FLS template
  // module pipeline which is not relevant to unit testing pure helpers.
  resolve: {
    alias: {
      "@js": path.resolve(__dirname, "src/js"),
    },
  },
  test: {
    // jsdom — needed for tests that touch window / localStorage (auth.js)
    environment: "jsdom",
    // Discover only our test files — avoid scanning template_modules / dist
    include: ["src/js/__tests__/**/*.test.js"],
    globals: false,
    // Reset state (mocks, timers) between tests for proper isolation
    clearMocks: true,
    restoreMocks: true,
  },
});
