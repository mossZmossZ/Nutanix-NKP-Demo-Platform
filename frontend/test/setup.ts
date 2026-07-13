import '@testing-library/jest-dom/vitest'

// jsdom has no ResizeObserver; react-resizable-panels needs one to mount.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// This jsdom setup ships a `localStorage` object whose methods are undefined
// (the `--localstorage-file` misconfig), so any surface that reads it — the
// AppShell sidebar, the lab-view split — throws. Swap in a working in-memory
// implementation.
if (typeof globalThis.localStorage?.getItem !== 'function') {
  const store = new Map<string, string>()
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, String(v)),
      removeItem: (k: string) => void store.delete(k),
      clear: () => store.clear(),
    },
  })
}

// jsdom has no matchMedia; the lab view uses it (useMediaQuery) to pick its
// layout. Evaluate min-/max-width against innerWidth so tests exercise the
// >=1280px desktop split (the primary surface) rather than the mobile fallback.
Object.defineProperty(globalThis, 'innerWidth', { configurable: true, value: 1280 })
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = ((query: string) => {
    const width = globalThis.innerWidth || 1280
    const min = query.match(/min-width:\s*(\d+)px/)
    const max = query.match(/max-width:\s*(\d+)px/)
    const matches = (!min || width >= Number(min[1])) && (!max || width <= Number(max[1]))
    return {
      matches,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }
  }) as unknown as typeof globalThis.matchMedia
}
