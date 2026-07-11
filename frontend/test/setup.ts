import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-resizable-panels needs one to mount.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}
