// Prerender: apre ogni pagina generata da postbuild in Chromium e salva nel file HTML il
// contenuto già disegnato dall'app. Così motori di ricerca e anteprime leggono testi e link
// subito, senza eseguire JavaScript; nel browser Vue poi rimonta la pagina come sempre.
// Uso: npm run prerender  (dopo npm run build; richiede Chromium di Playwright).
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, extname, join, normalize } from 'node:path'
import { chromium } from 'playwright'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const base = process.env.VITE_BASE || '/NisiixDev/'
const PAGES = [
  ['', 'index.html'],
  ['curriculum', 'curriculum.html'],
  ['progetti', 'progetti.html'],
  ['it/', 'it/index.html'],
  ['it/curriculum', 'it/curriculum.html'],
  ['it/progetti', 'it/progetti.html']
]
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject', '.xml': 'application/xml', '.txt': 'text/plain' }

// Stessa risoluzione dei percorsi di GitHub Pages: /x -> x.html, /x/ -> x/index.html.
// I file HTML vengono serviti dalla copia originale, non da quella già prerenderizzata.
const originals = new Map()
function resolve(urlPath) {
  if (!urlPath.startsWith(base)) return null
  const rel = normalize(decodeURIComponent(urlPath.slice(base.length))).replace(/^(\.\.[/\\])+/, '')
  const candidates = [rel, rel + '.html', join(rel, 'index.html')]
  for (const c of candidates) {
    const file = join(dist, c)
    if (existsSync(file) && statSync(file).isFile()) return file
  }
  return null
}
const server = createServer((req, res) => {
  const file = resolve(new URL(req.url, 'http://x').pathname)
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/html' })
    return res.end(originals.get(join(dist, '404.html')) ?? '')
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(originals.get(file) ?? readFileSync(file))
})
for (const [, file] of PAGES) originals.set(join(dist, file), readFileSync(join(dist, file), 'utf8'))
originals.set(join(dist, '404.html'), readFileSync(join(dist, '404.html'), 'utf8'))

await new Promise((r) => server.listen(0, '127.0.0.1', r))
const origin = `http://127.0.0.1:${server.address().port}`
const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' })
// Le richieste esterne (font) non servono per il contenuto
await context.route(/^https?:\/\/(?!127\.0\.0\.1)/, (route) => route.abort())

for (const [path, file] of PAGES) {
  const page = await context.newPage()
  await page.goto(origin + base + path, { waitUntil: 'networkidle' })
  await page.waitForSelector('#main-content > *')
  await page.waitForTimeout(800) // fine della transizione di pagina
  const html = await page.evaluate(() => document.getElementById('app').innerHTML)
  await page.close()
  const full = join(dist, file)
  const original = originals.get(full)
  if (!original.includes('<div id="app"></div>')) throw new Error(`#app non trovato in ${file}`)
  writeFileSync(full, original.replace('<div id="app"></div>', () => `<div id="app">${html}</div>`))
  console.log(`prerender: ${file} (${Math.round(html.length / 1024)} kB)`)
}

await browser.close()
server.close()
