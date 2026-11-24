// Genera il CV in PDF (italiano e inglese) dai contenuti della pagina Curriculum.
// Uso: npm run cv  (dopo npm run build). Scrive dist/cv/NisiixDev-CV-it.pdf e -en.pdf.
// Richiede Playwright con Chromium (nel deploy: npx playwright install chromium).
import { mkdirSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createPinia, setActivePinia } from 'pinia'
import { chromium } from 'playwright'
import { useCurriculumStore } from '../src/stores/curriculum.js'
import { useContattiStore } from '../src/stores/contatti.js'
import { messages } from '../src/i18n/messages.js'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, process.argv[2] || 'dist', 'cv')
const SITE = 'nisiix.github.io/NisiixDev'

setActivePinia(createPinia())
const curriculum = useCurriculumStore()
const contatti = useContattiStore()

// Stessi font del sito, letti dai pacchetti installati (nessuna richiesta a Google Fonts)
const fontData = (pkg, file) =>
  readFileSync(join(root, 'node_modules', '@fontsource-variable', pkg, 'files', file)).toString('base64')
const FONT_FACES = [
  ['Inter Variable', 'inter', 'inter-latin-wght-normal.woff2', '100 900'],
  ['Outfit Variable', 'outfit', 'outfit-latin-wght-normal.woff2', '100 900']
]
  .map(
    ([family, pkg, file, weight]) =>
      `@font-face { font-family: '${family}'; font-weight: ${weight}; font-style: normal; src: url(data:font/woff2;base64,${fontData(pkg, file)}) format('woff2'); }`
  )
  .join('\n')

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const tr = (v, lang) => (v && typeof v === 'object' ? v[lang] ?? v.it : v)

function html(lang) {
  const m = messages[lang]
  const socials = contatti.socials.filter((s) => s.url)
  const contacts = [
    contatti.email && `<a href="mailto:${esc(contatti.email)}">${esc(contatti.email)}</a>`,
    `<a href="https://${SITE}/">${SITE}</a>`,
    ...socials.map((s) => `<a href="${esc(s.url)}">${esc(s.url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`)
  ].filter(Boolean)

  const skills = curriculum.skills
    .map(
      (cat) => `
      <div class="cat">
        <h3>${esc(tr(cat.category, lang))}</h3>
        ${cat.items
          .map((it) => `<div class="skill"><strong>${esc(it.name)}</strong><span>${esc(tr(it.description, lang))}</span></div>`)
          .join('')}
      </div>`
    )
    .join('')

  // specText contiene già <strong>: è testo nostro, lo teniamo così com'è
  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<title>Nisiix Dev — ${esc(m.nav.curriculum)}</title>
<style>
${FONT_FACES}
  @page { size: A4; margin: 16mm 16mm 18mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter Variable', Arial, sans-serif; color: #1f1d19; font-size: 10pt; line-height: 1.55; }
  a { color: inherit; text-decoration: none; }
  header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px;
    padding-bottom: 14px; border-bottom: 2px solid #b08a1e; margin-bottom: 18px; }
  .name { display: flex; align-items: center; gap: 8px; font-family: 'Outfit Variable', Arial, sans-serif; font-weight: 800; font-size: 26pt; line-height: 1; }
  .logo { background: linear-gradient(135deg, #d4af37, #b8962e); color: #0a0a0a; padding: 4px 12px; border-radius: 8px; }
  .role { margin-top: 8px; font-size: 12pt; font-weight: 600; color: #8f6f12; letter-spacing: 0.3px; }
  .contacts { text-align: right; font-size: 9pt; color: #4a4740; line-height: 1.7; }
  h2 { font-family: 'Outfit Variable', Arial, sans-serif; font-size: 13pt; font-weight: 800; color: #121110;
    margin: 18px 0 8px; display: flex; align-items: center; gap: 8px; }
  h2::before { content: ''; width: 14px; height: 14px; border-radius: 3px; background: linear-gradient(135deg, #d4af37, #8f6f12); }
  p { color: #33312b; }
  strong { color: #121110; }
  .gold-text { color: #8f6f12; }
  .cat { margin-bottom: 10px; break-inside: avoid; }
  h3 { font-size: 10.5pt; font-weight: 700; color: #8f6f12; text-transform: uppercase; letter-spacing: 0.6px; margin: 10px 0 4px; }
  .skill { display: grid; grid-template-columns: 46mm 1fr; gap: 10px; padding: 5px 0; border-bottom: 1px solid #eee9dc; }
  .skill strong { font-weight: 600; }
  .skill span { color: #4a4740; }
  .stack { display: flex; flex-wrap: wrap; gap: 6px; }
  .stack span { padding: 3px 10px; border: 1px solid #d9cfae; border-radius: 100px; font-size: 8.5pt; color: #4a4740; background: #fbf8ef; }
  footer { margin-top: 22px; font-size: 8pt; color: #8a857a; text-align: center; }
</style>
</head>
<body>
  <header>
    <div>
      <div class="name"><span class="logo">Nisiix</span><span>Dev</span></div>
      <div class="role">${esc(m.cv.role)}</div>
    </div>
    <div class="contacts">${contacts.join('<br>')}</div>
  </header>

  <h2>${esc(m.cv.profile)}</h2>
  <p>${esc(m.curriculum.subtitle)}</p>

  <h2>${esc(m.cv.expertise)}</h2>
  <p>${m.curriculum.specText}</p>

  <h2>${esc(m.cv.skills)}</h2>
  ${skills}

  <h2>${esc(m.cv.stack)}</h2>
  <div class="stack">${curriculum.techStack.map((t) => `<span>${esc(t)}</span>`).join('')}</div>

  <footer>${esc(m.cv.footer)}</footer>
</body>
</html>`
}

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage()
for (const lang of Object.keys(messages)) {
  await page.setContent(html(lang), { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {})
  await page.evaluate(() => document.fonts?.ready)
  const file = join(outDir, `NisiixDev-CV-${lang}.pdf`)
  await page.pdf({ path: file, format: 'A4', printBackground: true, preferCSSPageSize: true })
  console.log('CV:', file)
}
await browser.close()
