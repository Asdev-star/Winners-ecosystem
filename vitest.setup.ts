// Minimal vitest setup for v1.6.1
// Note: This file runs in the test context, not Node.js

import { afterEach, beforeAll } from 'vitest';

// Setup browser mocks for happy-dom
beforeAll(() => {
  // Mock matchMedia for components that use it
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: (query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: () => {},
        removeListener: () => {},
        addEventListener: () => {},
        removeEventListener: () => {},
        dispatchEvent: () => true,
      }),
    });
  }
});

// Cleanup after each test
afterEach(() => {
  // Clean up any timers or mocks
});
