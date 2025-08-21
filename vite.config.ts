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
        { src: 'apps.json', dest: '' },
        { src: 'thumbs/**/*', dest: 'thumbs' }
      ]
    })
  ],
  // Dev server: serve /apps.json from project root and disable caching
  // Also serve /thumbs/* from project root for local development parity
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
      if (req.url && req.url.startsWith('/thumbs/')) {
        const p2 = path.resolve(process.cwd(), req.url.slice(1))
        if (fs.existsSync(p2)) {
          if (p2.endsWith('.png')) {
            res.setHeader('Content-Type', 'image/png')
          }
          res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
          return res.end(fs.readFileSync(p2))
        }
      }
      next()
    })
  }
})
