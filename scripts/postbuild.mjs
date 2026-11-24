// Dopo vite build: pagine indicizzabili per ogni sezione, 404 personalizzata, sitemap e robots.
// GitHub Pages serve /curriculum da curriculum.html (risposta 200, con meta propri)
// e qualsiasi indirizzo sconosciuto da 404.html, dove l'app mostra la pagina 404 a blocchi.
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { messages } from '../src/i18n/messages.js'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const base = process.env.VITE_BASE || '/NisiixDev/'
const site = (process.env.SITE_ORIGIN || 'https://nisiix.github.io') + base
const it = messages.it

const pages = [
  { file: 'index.html', path: '', title: it.titles.home, description: it.meta.home, priority: '1.0' },
  { file: 'curriculum.html', path: 'curriculum', title: it.titles.curriculum, description: it.meta.curriculum, priority: '0.8' },
  { file: 'progetti.html', path: 'progetti', title: it.titles.projects, description: it.meta.projects, priority: '0.8' },
  { file: '404.html', path: null, title: it.titles.notFound, description: it.meta.notFound }
]

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

function render({ path, title, description }) {
  const url = site + (path ?? '')
  const set = (html, re, value) => html.replace(re, (_, a, b) => a + attr(value) + b)
  let html = template
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(title)}</title>`)
  html = set(html, /(<meta name="description" content=")[^"]*(")/, description)
  html = set(html, /(<meta property="og:title" content=")[^"]*(")/, title)
  html = set(html, /(<meta property="og:description" content=")[^"]*(")/, description)
  html = set(html, /(<meta name="twitter:title" content=")[^"]*(")/, title)
  html = set(html, /(<meta name="twitter:description" content=")[^"]*(")/, description)
  html = set(html, /(<meta property="og:url" content=")[^"]*(")/, url)
  html = set(html, /(<link rel="canonical" href=")[^"]*(")/, url)
  if (path === null) html = set(html, /(<meta name="robots" content=")[^"]*(")/, 'noindex, follow')
  return html
}

for (const page of pages) writeFileSync(join(dist, page.file), render(page))

const today = new Date().toISOString().slice(0, 10)
const urls = pages
  .filter((p) => p.path !== null)
  .map((p) => `  <url><loc>${site}${p.path}</loc><lastmod>${today}</lastmod><priority>${p.priority}</priority></url>`)
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`)

console.log('postbuild:', pages.map((p) => p.file).join(', '), '+ sitemap.xml, robots.txt')
