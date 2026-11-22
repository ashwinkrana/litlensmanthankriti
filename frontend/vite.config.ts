import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Browser calls /api/... on the frontend port; Vite forwards them to FastAPI, so no CORS issues.
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8000',
    changeOrigin: false,
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: apiProxy,
    // Transform the app's entry and pages as soon as the dev server starts,
    // instead of on the first page load.
    warmup: {
      clientFiles: ['./src/main.tsx', './src/App.tsx', './src/pages/*.tsx'],
    },
  },
  // `npm run demo`: the production build served on :4173, with the same /api proxy.
  preview: {
    port: 4173,
    strictPort: true,
    proxy: apiProxy,
  },
  optimizeDeps: {
    // Pre-bundle the libraries the lazy pages use too. Otherwise Vite finds
    // them only when those pages first load, re-bundles, and reloads the tab
    // (the "Outdated Optimize Dep" 504s).
    include: ['react', 'react-dom', 'react-dom/client', 'react-markdown', 'remark-gfm', 'wobnimo'],
  },
})
