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
      // MDX docs live at repo-root /docs-content (outside frontend/), so their
      // compiled `react/jsx-runtime` + `@mdx-js/react` imports can't resolve via
      // node's upward walk — pin them to frontend's node_modules.
      react: path.resolve(__dirname, 'node_modules/react'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
      '@mdx-js/react': path.resolve(__dirname, 'node_modules/@mdx-js/react'),
    },
  },
  server: {
    // Single-origin dev: proxy the API so the auth cookie is first-party.
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
    // Allow importing MDX from the repo-root /docs-content (outside the Vite root).
    fs: {
      allow: [path.resolve(__dirname, '..')],
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    css: false,
  },
})
