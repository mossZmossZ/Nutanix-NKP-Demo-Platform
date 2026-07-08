/// <reference types="vitest/config" />
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // MDX must run before the React plugin so JSX it emits gets transformed.
    { enforce: 'pre', ...mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkFrontmatter, [remarkMdxFrontmatter, { name: 'frontmatter' }]],
    }) },
    react({ include: /\.(jsx|tsx|js|ts|mdx)$/ }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Single-origin dev: proxy the API so the auth cookie is first-party.
    proxy: {
      '/api': 'http://localhost:4000',
    },
    // Allow importing MDX from the repo-root /docs-content (outside the Vite root).
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  // @ts-expect-error - Vitest config extends Vite config
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
})
