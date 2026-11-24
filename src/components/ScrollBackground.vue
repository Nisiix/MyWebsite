<template>
  <!--
    Sfondo animato dallo scroll:
    - griglia disegnata su canvas, con parallasse
    - blocchi della griglia che si alzano in 3D, ognuno in un momento diverso dello scroll
    - in cima alla home i blocchi scrivono NISIIX, lettera per lettera, all'arrivo sulla pagina
    - bagliori dorati che attraversano lo schermo
  -->
  <div class="scroll-bg" aria-hidden="true">
    <canvas ref="canvas" class="bg-canvas"></canvas>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <div class="bg-glow bg-glow-3"></div>
    <div class="bg-vignette"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { theme } from '@/theme'

const canvas = ref(null)
const route = useRoute()

// ---- Parametri ----
// lato di un quadrato della griglia (px): 5vw tra 18 e 60, così la scritta entra anche su mobile
const cellSize = (w) => Math.min(60, Math.max(18, Math.floor(w / 20)))
const PARALLAX = 0.12 // la griglia scorre al 12% della velocità della pagina
const DENSITY = 0.12 // quota di quadrati che possono alzarsi
const MAX_LIFT = 0.22 // altezza massima: il tetto del blocco si avvicina del 16% verso chi guarda
const RISE_WINDOW = 1300 // px di scroll in cui un blocco resta alzato
const EASE = 0.08 // morbidezza dell'animazione (più basso = più lento)
const SCROLL_START = 20 // px: i blocchi casuali iniziano ad alzarsi solo dopo questo scroll
const WORD_LIFT = 0.07 // altezza dei blocchi della scritta: bassa, così le lettere restano leggibili
const WORD_FADE = 380 // px di scroll in cui la scritta NISIIX si abbassa fino a sparire

// Scritta NISIIX a blocchi (5 righe), mostrata in cima alla home.
// Ogni lettera elenca i suoi blocchi [col, riga] nell'ordine in cui si scrive a mano:
// all'arrivo sulla home si alzano uno alla volta, lettera dopo lettera.
const GLYPHS = {
  // sale a sinistra, scende in diagonale, risale a destra fino in alto
  N: { w: 4, path: [[0, 4], [0, 3], [0, 2], [0, 1], [0, 0], [1, 1], [2, 2], [3, 4], [3, 3], [3, 2], [3, 1], [3, 0]] },
  // dall'alto in basso
  I: { w: 1, path: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  // dall'angolo in alto a destra, a serpentina fino in basso a sinistra
  S: { w: 3, path: [[2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [1, 2], [2, 2], [2, 3], [2, 4], [1, 4], [0, 4]] },
  // prima la diagonale da in alto a sinistra, poi quella da in alto a destra
  X: { w: 3, path: [[0, 0], [0, 1], [1, 2], [2, 3], [2, 4], [2, 0], [2, 1], [0, 3], [0, 4]] },
  // giù a sinistra, il trattino, poi l'asta destra dall'alto in basso
  4: { w: 3, path: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 0], [2, 1], [2, 2], [2, 3], [2, 4]] },
  // un giro in senso antiorario partendo da in alto a destra
  0: { w: 3, path: [[2, 0], [1, 0], [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [1, 4], [2, 4], [2, 3], [2, 2], [2, 1]] }
}
const BLOCK_STEP = 55 // ms tra un blocco e il successivo
const LETTER_PAUSE = 160 // ms di pausa in più tra una lettera e l'altra
const WORD_DELAY = 250 // ms prima del primo blocco

// Celle di una parola: [col, row, ritardo in ms] relative all'angolo in alto a sinistra
const wordCache = new Map()
function buildWord(word) {
  if (wordCache.has(word)) return wordCache.get(word)
  const cells = []
  let w = 0
  let clock = WORD_DELAY
  for (const ch of word) {
    const g = GLYPHS[ch]
    if (!g) continue
    for (const [c, r] of g.path) {
      cells.push([w + c, r, clock])
      clock += BLOCK_STEP
    }
    clock += LETTER_PAUSE
    w += g.w + 1
  }
  // fine della scrittura, con il tempo per l'ultimo blocco di salire
  const built = { cells, width: Math.max(w - 1, 0), duration: clock + 1200 }
  wordCache.set(word, built)
  return built
}
const WORD_EASE = 0.13 // i blocchi della scritta salgono un po' più rapidi
const WORD_H = 5 // righe di ogni lettera
const WORD_RAISE = 1 // righe di cui la scritta sta più in alto rispetto al centro dello spazio vuoto

// Colori per tema: griglia, facce dei blocchi (oro), tetto, bordo del tetto
const PALETTES = {
  dark: { grid: 'rgba(255, 255, 255, 0.03)', side: '212, 175, 55', sideBoost: 1, roof: '24, 22, 16', edge: '212, 175, 55' },
  light: { grid: 'rgba(0, 0, 0, 0.05)', side: '176, 138, 30', sideBoost: 2.2, roof: '251, 245, 226', edge: '143, 111, 18' }
}

let ctx = null
let CELL = 60
let wordCells = null // celle ("col:row") della scritta -> ritardo in ms, null se non siamo sulla home
let wordName = '' // parola mostrata: NISIIX in home, 404 nella pagina non trovata
let wordDuration = 0
let wordStart = 0 // istante in cui è iniziata la scrittura
let wordElapsed = 0 // ms trascorsi dall'inizio della scrittura, aggiornato a ogni fotogramma
let width = 0
let height = 0
let dpr = 1
let frame = 0
let maxScroll = 1
const lifts = new Map() // altezza attuale di ogni blocco, per animarla verso l'obiettivo

// Numero pseudo-casuale stabile per ogni quadrato (stessa posizione = stesso valore)
function hash(col, row, seed) {
  let h = (col * 374761393 + row * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// Altezza che il blocco dovrebbe avere a questa posizione di scroll
function targetLift(col, row, scrollY) {
  let word = 0
  const delay = wordCells?.get(`${col}:${row}`)
  if (delay !== undefined && wordElapsed >= delay) {
    const w = Math.max(0, 1 - scrollY / WORD_FADE)
    word = WORD_LIFT * w * w
  }
  return Math.max(word, randomLift(col, row, scrollY))
}

function randomLift(col, row, scrollY) {
  if (hash(col, row, 1) > DENSITY) return 0
  // ogni blocco ha il suo momento, distribuito lungo la pagina a partire dal primo scroll:
  // in cima alla pagina non c'è nessun blocco alzato
  const start = SCROLL_START + hash(col, row, 2) * Math.max(maxScroll - SCROLL_START, 1)
  const t = (scrollY - start) / RISE_WINDOW
  if (t <= 0 || t >= 1) return 0
  const bump = Math.sin(t * Math.PI) // sale e poi riscende
  return bump * MAX_LIFT * (0.45 + hash(col, row, 3) * 0.55)
}

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  width = window.innerWidth
  height = window.innerHeight
  CELL = cellSize(width)
  const el = canvas.value
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  maxScroll = Math.max(document.documentElement.scrollHeight - height, 1)
  measureWord()
}

// Posiziona la scritta sulla griglia, centrata nello spazio vuoto lasciato dal titolo della home
function measureWord() {
  const anchor = document.querySelector('[data-bg-word]')
  if (!anchor) {
    wordCells = null
    wordName = ''
    return
  }
  const name = anchor.dataset.bgWord || 'NISIIX'
  const word = buildWord(name)
  // arrivando sulla pagina (o cambiando parola) la scrittura riparte da capo
  if (!wordCells || name !== wordName) wordStart = performance.now()
  wordName = name
  wordDuration = word.duration
  const rect = anchor.getBoundingClientRect()
  // posizione nella pagina; a scroll 0 la riga r della griglia sta a y = r * CELL
  const centerY = rect.top + window.scrollY + rect.height / 2
  const top = Math.round(centerY / CELL - WORD_H / 2) - WORD_RAISE
  const left = Math.round((width / CELL - word.width) / 2)
  wordCells = new Map(word.cells.map(([c, r, d]) => [`${left + c}:${top + r}`, d]))
}

// Prospettiva vista dall'alto: il tetto di un blocco alzato si allarga dal centro dello schermo
function project(x, y, lift, cx, cy) {
  const k = 1 + lift
  return [cx + (x - cx) * k, cy + (y - cy) * k]
}

function draw() {
  const scrollY = window.scrollY
  const offsetY = -((scrollY * PARALLAX) % CELL)
  const firstRow = Math.floor((scrollY * PARALLAX) / CELL)
  wordElapsed = performance.now() - wordStart
  const cols = Math.ceil(width / CELL) + 1
  const rows = Math.ceil(height / CELL) + 2
  const cx = width / 2
  const cy = height / 2

  ctx.clearRect(0, 0, width, height)

  // Griglia piatta
  ctx.strokeStyle = PALETTES[theme.value].grid
  ctx.lineWidth = 1
  ctx.beginPath()
  for (let c = 0; c <= cols; c++) {
    const x = Math.round(c * CELL) + 0.5
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
  }
  for (let r = 0; r <= rows; r++) {
    const y = Math.round(offsetY + r * CELL) + 0.5
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
  }
  ctx.stroke()

  // Blocchi: calcola altezze, poi disegna dal più lontano dal centro al più vicino
  // finché la scritta non è completa bisogna continuare a disegnare
  let animating = !!wordCells && wordElapsed < wordDuration
  const blocks = []
  const seen = new Set()
  for (let r = -1; r < rows; r++) {
    const row = firstRow + r
    for (let col = 0; col < cols; col++) {
      const key = `${col}:${row}`
      seen.add(key)
      const target = targetLift(col, row, scrollY)
      const prev = lifts.get(key) ?? 0
      const ease = wordCells?.has(key) ? WORD_EASE : EASE
      const next = prev + (target - prev) * ease
      if (Math.abs(target - next) > 0.0005) animating = true
      if (next < 0.002 && target === 0) {
        lifts.delete(key)
        continue
      }
      lifts.set(key, next)
      const x = col * CELL
      const y = offsetY + r * CELL
      const dist = Math.hypot(x + CELL / 2 - cx, y + CELL / 2 - cy)
      blocks.push({ x, y, lift: next, dist })
    }
  }
  // dimentica i blocchi usciti dallo schermo
  for (const key of lifts.keys()) if (!seen.has(key)) lifts.delete(key)

  blocks.sort((a, b) => b.dist - a.dist)
  for (const b of blocks) drawBlock(b, cx, cy)

  return animating
}

function drawBlock({ x, y, lift }, cx, cy) {
  const base = [
    [x, y],
    [x + CELL, y],
    [x + CELL, y + CELL],
    [x, y + CELL]
  ]
  const top = base.map(([px, py]) => project(px, py, lift, cx, cy))
  // i blocchi bassi (come quelli della scritta) restano ben visibili
  const strength = Math.min(lift / (MAX_LIFT * 0.3), 1)
  const pal = PALETTES[theme.value]

  // Facce laterali: più chiare quelle rivolte verso l'alto (luce dall'alto)
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4
    const light = i === 0 ? 0.2 : i === 3 ? 0.14 : i === 1 ? 0.09 : 0.06
    ctx.beginPath()
    ctx.moveTo(base[i][0], base[i][1])
    ctx.lineTo(base[j][0], base[j][1])
    ctx.lineTo(top[j][0], top[j][1])
    ctx.lineTo(top[i][0], top[i][1])
    ctx.closePath()
    ctx.fillStyle = `rgba(${pal.side}, ${light * pal.sideBoost * strength})`
    ctx.fill()
  }

  // Tetto
  ctx.beginPath()
  ctx.moveTo(top[0][0], top[0][1])
  for (let i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1])
  ctx.closePath()
  ctx.fillStyle = `rgba(${pal.roof}, ${0.96 * strength})`
  ctx.fill()
  ctx.strokeStyle = `rgba(${pal.edge}, ${0.6 * strength})`
  ctx.lineWidth = 1
  ctx.stroke()
}

// Disegna a ogni fotogramma solo finché qualcosa si muove
function tick() {
  frame = 0
  const root = document.documentElement
  root.style.setProperty('--scroll-y', String(window.scrollY))
  root.style.setProperty('--scroll-p', String(Math.min(window.scrollY / maxScroll, 1)))
  if (draw()) schedule()
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(tick)
}
function onResize() {
  resize()
  schedule()
}

let resizeObserver = null

onMounted(() => {
  ctx = canvas.value.getContext('2d')
  resize()
  tick()
  window.addEventListener('scroll', schedule, { passive: true })
  window.addEventListener('resize', onResize, { passive: true })
  // l'altezza della pagina cambia cambiando pagina o lingua
  resizeObserver = new ResizeObserver(() => {
    maxScroll = Math.max(document.documentElement.scrollHeight - height, 1)
    measureWord()
    schedule()
  })
  resizeObserver.observe(document.body)
})

// nuovo tema: ridisegna con i colori giusti
watch(theme, schedule)

// cambiando pagina la scritta compare o scompare (dopo la transizione)
watch(
  () => route.fullPath,
  () => {
    measureWord()
    schedule()
    setTimeout(() => {
      measureWord()
      schedule()
    }, 500)
  }
)

onUnmounted(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', schedule)
  window.removeEventListener('resize', onResize)
  resizeObserver?.disconnect()
})
</script>

<style scoped>
.scroll-bg {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: var(--bg-primary);
}

.bg-canvas {
  position: absolute;
  inset: 0;
  mask-image: radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 90%);
  -webkit-mask-image: radial-gradient(ellipse 85% 75% at 50% 50%, black 35%, transparent 90%);
}

/* Bagliori: attraversano lo schermo mentre si scorre, ognuno con traiettoria propria */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  /* sfumatura radiale al posto di filter: blur, molto più leggera da animare */
  background: radial-gradient(circle, var(--glow-color) 0%, transparent 70%);
  will-change: transform;
}

.bg-glow-1 {
  width: 900px;
  height: 900px;
  top: -30%;
  right: -30%;
  --glow-color: var(--gold);
  opacity: 0.14;
  transform: translate3d(
      calc(var(--scroll-p, 0) * -55vw),
      calc(var(--scroll-p, 0) * 70vh),
      0
    )
    scale(calc(1 + var(--scroll-p, 0) * 0.3));
}

.bg-glow-2 {
  width: 760px;
  height: 760px;
  bottom: -35%;
  left: -28%;
  --glow-color: var(--gold-dark);
  opacity: 0.12;
  transform: translate3d(
      calc(var(--scroll-p, 0) * 45vw),
      calc(var(--scroll-p, 0) * -60vh),
      0
    );
}

.bg-glow-3 {
  width: 560px;
  height: 560px;
  top: 25%;
  left: 30%;
  --glow-color: var(--gold-light);
  opacity: 0.05;
  transform: translate3d(
      calc(sin(var(--scroll-p, 0) * 6.283rad) * 30vw),
      calc(var(--scroll-y, 0) * -0.05px),
      0
    );
}

/* Bordi più scuri per tenere il contenuto leggibile */
.bg-vignette {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, transparent 55%, var(--vignette));
}

@media (prefers-reduced-motion: reduce) {
  .bg-glow {
    transform: none;
  }
}
</style>
