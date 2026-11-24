<template>
  <!-- Sfondo animato dallo scroll: griglia e bagliori dorati che si spostano a velocità diverse -->
  <div class="scroll-bg" aria-hidden="true">
    <div class="bg-grid"></div>
    <div class="bg-grid bg-grid-lit" :class="{ active: pointerActive }" :style="litStyle"></div>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>
    <div class="bg-glow bg-glow-3"></div>
    <div class="bg-vignette"></div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Scrive lo scroll in due variabili CSS:
// --scroll-y (pixel) per la parallasse, --scroll-p (0-1) per spostare i bagliori lungo la pagina
let frame = 0
function update() {
  frame = 0
  const root = document.documentElement
  const max = root.scrollHeight - window.innerHeight
  root.style.setProperty('--scroll-y', String(window.scrollY))
  root.style.setProperty('--scroll-p', String(max > 0 ? Math.min(window.scrollY / max, 1) : 0))
}
function onScroll() {
  if (!frame) frame = requestAnimationFrame(update)
}

// La griglia si illumina attorno al puntatore (solo con mouse)
const pointer = ref({ x: 0, y: 0 })
const pointerActive = ref(false)
const litStyle = computed(() => ({
  '--px': `${pointer.value.x}px`,
  '--py': `${pointer.value.y}px`
}))
function onPointer(e) {
  if (e.pointerType !== 'mouse') return
  pointer.value = { x: e.clientX, y: e.clientY }
  pointerActive.value = true
}
function onLeave() {
  pointerActive.value = false
}

onMounted(() => {
  update()
  window.addEventListener('pointermove', onPointer, { passive: true })
  document.documentElement.addEventListener('pointerleave', onLeave)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll, { passive: true })
})
onUnmounted(() => {
  cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('pointermove', onPointer)
  document.documentElement.removeEventListener('pointerleave', onLeave)
  window.removeEventListener('resize', onScroll)
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

/* Griglia: scorre più lentamente del contenuto (parallasse) */
.bg-grid {
  position: absolute;
  inset: -120px 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.025) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: translate3d(0, calc(var(--scroll-y, 0) * -0.12px), 0);
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 85%);
  will-change: transform;
}

/* Copia dorata della griglia, visibile solo attorno al puntatore */
.bg-grid-lit {
  background-image:
    linear-gradient(rgba(212, 175, 55, 0.18) 1px, transparent 1px),
    linear-gradient(90deg, rgba(212, 175, 55, 0.18) 1px, transparent 1px);
  /* la griglia parte 120px sopra lo schermo e si sposta con la parallasse */
  --spot-y: calc(var(--py) + 120px + var(--scroll-y, 0) * 0.12px);
  mask-image: radial-gradient(240px circle at var(--px) var(--spot-y), black, transparent 70%);
  -webkit-mask-image: radial-gradient(240px circle at var(--px) var(--spot-y), black, transparent 70%);
  opacity: 0;
  transition: opacity 0.6s var(--ease-smooth);
}

.bg-grid-lit.active {
  opacity: 1;
}

/* Bagliori: attraversano lo schermo mentre si scorre, ognuno con traiettoria propria */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
  will-change: transform;
}

.bg-glow-1 {
  width: 520px;
  height: 520px;
  top: -10%;
  right: -12%;
  background: var(--gold);
  opacity: 0.09;
  transform: translate3d(
      calc(var(--scroll-p, 0) * -55vw),
      calc(var(--scroll-p, 0) * 70vh),
      0
    )
    scale(calc(1 + var(--scroll-p, 0) * 0.3));
}

.bg-glow-2 {
  width: 420px;
  height: 420px;
  bottom: -15%;
  left: -10%;
  background: var(--gold-dark);
  opacity: 0.08;
  transform: translate3d(
      calc(var(--scroll-p, 0) * 45vw),
      calc(var(--scroll-p, 0) * -60vh),
      0
    );
}

.bg-glow-3 {
  width: 300px;
  height: 300px;
  top: 40%;
  left: 45%;
  background: var(--gold-light);
  opacity: 0.035;
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
  .bg-grid,
  .bg-glow {
    transform: none;
  }
}
</style>
