import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

const buildId = new Date().toISOString()

export default defineConfig({
  base: '/estudia-al-toque/',
  define: { __APP_BUILD__: JSON.stringify(buildId) },
  plugins: [{
    name: 'pwa-versioned-worker',
    generateBundle(_, bundle) {
      const files = Object.keys(bundle).filter(name => name.startsWith('assets/'))
      const source = readFileSync(new URL('./src/pwa-sw.js', import.meta.url), 'utf8')
        .replace('__CACHE_VERSION__', JSON.stringify(buildId))
        .replace('__PRECACHE_FILES__', JSON.stringify(['./', './manifest.webmanifest', ...files]))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: buildId }) })
    },
  }],
})
