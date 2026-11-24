<template>
  <!--
    Sfondo animato dallo scroll:
    - griglia disegnata su canvas, con parallasse
    - blocchi della griglia che si alzano in 3D, ognuno in un momento diverso dello scroll
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
import { ref, onMounted, onUnmounted } from 'vue'

const canvas = ref(null)

// ---- Parametri ----
const CELL = 60 // lato di un quadrato della griglia (px)
const PARALLAX = 0.12 // la griglia scorre al 12% della velocità della pagina
const DENSITY = 0.12 // quota di quadrati che possono alzarsi
const MAX_LIFT = 0.22 // altezza massima: il tetto del blocco si avvicina del 16% verso chi guarda
const RISE_WINDOW = 1300 // px di scroll in cui un blocco resta alzato
const EASE = 0.08
const SCROLL_START = 20 // px: i blocchi iniziano ad alzarsi solo dopo questo scroll // morbidezza dell'animazione (più basso = più lento)

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

let ctx = null
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
  const el = canvas.value
  el.width = Math.round(width * dpr)
  el.height = Math.round(height * dpr)
  el.style.width = `${width}px`
  el.style.height = `${height}px`
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  maxScroll = Math.max(document.documentElement.scrollHeight - height, 1)
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
  const cols = Math.ceil(width / CELL) + 1
  const rows = Math.ceil(height / CELL) + 2
  const cx = width / 2
  const cy = height / 2

  ctx.clearRect(0, 0, width, height)

  // Griglia piatta
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
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
  let animating = false
  const blocks = []
  const seen = new Set()
  for (let r = -1; r < rows; r++) {
    const row = firstRow + r
    for (let col = 0; col < cols; col++) {
      const key = `${col}:${row}`
      seen.add(key)
      const target = targetLift(col, row, scrollY)
      const prev = lifts.get(key) ?? 0
      const next = reducedMotion ? target : prev + (target - prev) * EASE
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
  const strength = Math.min(lift / MAX_LIFT, 1)

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
    ctx.fillStyle = `rgba(212, 175, 55, ${light * strength})`
    ctx.fill()
  }

  // Tetto
  ctx.beginPath()
  ctx.moveTo(top[0][0], top[0][1])
  for (let i = 1; i < 4; i++) ctx.lineTo(top[i][0], top[i][1])
  ctx.closePath()
  ctx.fillStyle = `rgba(24, 22, 16, ${0.9 * strength})`
  ctx.fill()
  ctx.strokeStyle = `rgba(212, 175, 55, ${0.5 * strength})`
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
    schedule()
  })
  resizeObserver.observe(document.body)
})

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
  background: radial-gradient(ellipse at center, transparent 55%, rgba(0, 0, 0, 0.45));
}

@media (prefers-reduced-motion: reduce) {
  .bg-glow {
    transform: none;
  }
}
</style>
