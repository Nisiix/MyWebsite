// Dopo vite build: una pagina HTML vera per ogni sezione e lingua, 404 personalizzata, sitemap e robots.
// Inglese (predefinito) in radice, italiano sotto /it/. GitHub Pages serve /curriculum da
// curriculum.html e /it/curriculum da it/curriculum.html (risposta 200, con meta propri);
// qualsiasi indirizzo sconosciuto da 404.html, dove l'app mostra la pagina 404 a blocchi.
// Poi `npm run prerender` riempie queste pagine con il contenuto già disegnato.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { messages } from '../src/i18n/messages.js'
import { useContattiStore } from '../src/stores/contatti.js'

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
const base = process.env.VITE_BASE || '/NisiixDev/'
const site = (process.env.SITE_ORIGIN || 'https://nisiix.github.io') + base

setActivePinia(createPinia())
const sameAs = useContattiStore().socials.map((s) => s.url).filter(Boolean)

const LANGS = ['en', 'it'] // il primo è il predefinito (x-default)
const OG_LOCALE = { en: 'en_US', it: 'it_IT' }
const SECTIONS = [
  { key: 'home', path: '', titleKey: 'home', priority: '1.0' },
  { key: 'curriculum', path: 'curriculum', titleKey: 'curriculum', priority: '0.8' },
  { key: 'projects', path: 'progetti', titleKey: 'projects', priority: '0.8' }
]
const urlFor = (lang, path) => site + (lang === LANGS[0] ? '' : lang + '/') + path

const pages = []
for (const lang of LANGS) {
  for (const s of SECTIONS) {
    pages.push({
      lang,
      section: s,
      file: (lang === LANGS[0] ? '' : lang + '/') + (s.path || 'index') + '.html',
      url: urlFor(lang, s.path),
      title: messages[lang].titles[s.titleKey],
      description: messages[lang].meta[s.key]
    })
  }
}
const notFound = {
  lang: LANGS[0],
  file: '404.html',
  url: site,
  title: messages[LANGS[0]].titles.notFound,
  description: messages[LANGS[0]].meta.notFound,
  noindex: true
}

const template = readFileSync(join(dist, 'index.html'), 'utf8')
const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Dati strutturati: il sito, la persona e la pagina, nella lingua della pagina
function jsonLd(page) {
  const m = messages[page.lang]
  const graph = [
    {
      '@type': 'WebSite',
      '@id': site + '#website',
      name: 'Nisiix Dev',
      url: site,
      inLanguage: LANGS,
      publisher: { '@id': site + '#person' }
    },
    {
      '@type': 'Person',
      '@id': site + '#person',
      name: 'Nisiix',
      alternateName: 'Nisiix Dev',
      jobTitle: page.lang === 'it' ? 'Sviluppatore software' : 'Software developer',
      description: m.meta.home,
      url: site,
      image: site + 'og-image.png',
      sameAs,
      knowsAbout: ['Visual Basic 6', 'C#', '.NET', 'JavaScript', 'Vue.js', 'Express.js', 'Java', page.lang === 'it' ? 'Software gestionale' : 'Business management software']
    }
  ]
  if (!page.noindex) {
    graph.push({
      '@type': page.section.key === 'curriculum' ? 'ProfilePage' : page.section.key === 'projects' ? 'CollectionPage' : 'WebPage',
      '@id': page.url + '#webpage',
      url: page.url,
      name: page.title,
      description: page.description,
      inLanguage: page.lang,
      isPartOf: { '@id': site + '#website' },
      ...(page.section.key === 'curriculum' ? { mainEntity: { '@id': site + '#person' } } : { about: { '@id': site + '#person' } })
    })
  }
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2).replace(/</g, '\\u003c')
  return `<script type="application/ld+json">\n${json}\n    </script>`
}

function render(page) {
  const set = (html, re, value) => html.replace(re, (_, a, b) => a + attr(value) + b)
  const bare = page.noindex ? '' : page.section.path
  let html = template
  html = html.replace(/<html lang="[^"]*">/, `<html lang="${page.lang}">`)
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${attr(page.title)}</title>`)
  html = set(html, /(<meta name="description" content=")[^"]*(")/, page.description)
  html = set(html, /(<meta property="og:title" content=")[^"]*(")/, page.title)
  html = set(html, /(<meta property="og:description" content=")[^"]*(")/, page.description)
  html = set(html, /(<meta name="twitter:title" content=")[^"]*(")/, page.title)
  html = set(html, /(<meta name="twitter:description" content=")[^"]*(")/, page.description)
  html = set(html, /(<meta property="og:url" content=")[^"]*(")/, page.url)
  html = set(html, /(<meta property="og:locale" content=")[^"]*(")/, OG_LOCALE[page.lang])
  html = set(html, /(<meta property="og:locale:alternate" content=")[^"]*(")/, OG_LOCALE[page.lang === 'it' ? 'en' : 'it'])
  html = set(html, /(<meta property="og:image:alt" content=")[^"]*(")/, messages[page.lang].meta.ogImageAlt)
  html = set(html, /(<link rel="canonical" href=")[^"]*(")/, page.url)
  for (const lang of LANGS) html = set(html, new RegExp(`(<link rel="alternate" hreflang="${lang}" href=")[^"]*(")`), urlFor(lang, bare))
  html = set(html, /(<link rel="alternate" hreflang="x-default" href=")[^"]*(")/, urlFor(LANGS[0], bare))
  html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, jsonLd(page))
  if (page.noindex) html = set(html, /(<meta name="robots" content=")[^"]*(")/, 'noindex, follow')
  return html
}

for (const page of [...pages, notFound]) {
  mkdirSync(dirname(join(dist, page.file)), { recursive: true })
  writeFileSync(join(dist, page.file), render(page))
}

// Sitemap con le versioni linguistiche di ogni pagina
const today = new Date().toISOString().slice(0, 10)
const urls = pages.map((p) => {
  const alternates = LANGS.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${urlFor(l, p.section.path)}"/>`)
  alternates.push(`    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor(LANGS[0], p.section.path)}"/>`)
  return `  <url>\n    <loc>${p.url}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${p.section.priority}</priority>\n${alternates.join('\n')}\n  </url>`
})
writeFileSync(
  join(dist, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${urls.join('\n')}\n</urlset>\n`
)
writeFileSync(join(dist, 'robots.txt'), `User-agent: *\nAllow: /\n\nSitemap: ${site}sitemap.xml\n`)

console.log('postbuild:', [...pages, notFound].map((p) => p.file).join(', '), '+ sitemap.xml, robots.txt')
