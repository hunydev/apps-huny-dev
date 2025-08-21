import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'
import fs from 'node:fs'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        { src: 'apps.json', dest: '' }
      ]
    })
  ],
  // Dev server: serve /apps.json from project root and disable caching
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/apps.json') {
        const p = path.resolve(process.cwd(), 'apps.json')
        if (fs.existsSync(p)) {
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          return res.end(fs.readFileSync(p))
        }
      }
      next()
    })
  }
})
