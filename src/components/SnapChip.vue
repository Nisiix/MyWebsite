<template>
  <button
    type="button"
    class="snap-chip"
    :class="{ cooling }"
    :aria-label="labels[current]"
    :aria-pressed="current === 'sacrifice'"
    @pointerenter="onEnter"
    @pointerleave="onLeave"
    @focus="onFocus"
    @blur="onLeave"
    @click="onClick"
  >
    <span class="snap-inner" :style="{ transform: `rotateY(${turns * 180}deg)` }">
      <!-- tutte le etichette invisibili: danno al pulsante la larghezza della più lunga -->
      <span v-for="k in KINDS" :key="'s' + k" class="snap-face snap-sizer" aria-hidden="true">
        <i :class="['pi', ICONS[k]]"></i><span>{{ labels[k] }}</span>
      </span>
      <span class="snap-face front" :class="'is-' + faces[0]" aria-hidden="true">
        <i :class="['pi', ICONS[faces[0]]]"></i><span>{{ labels[faces[0]] }}</span>
      </span>
      <span class="snap-face back" :class="'is-' + faces[1]" aria-hidden="true">
        <i :class="['pi', ICONS[faces[1]]]"></i><span>{{ labels[faces[1]] }}</span>
      </span>
    </span>
  </button>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { t } from '@/i18n'
import { setSnap } from '@/stores/snap'

const KINDS = ['chip', 'snap', 'sacrifice']
const ICONS = { chip: 'pi-code', snap: 'pi-bolt', sacrifice: 'pi-shield' }
const COOLDOWN = 5000

const labels = computed(() => ({
  chip: t('home.badge'),
  snap: t('home.snap'),
  sacrifice: t('home.sacrifice')
}))

// la carta gira sempre di mezzo giro: la faccia visibile è turns % 2,
// e il contenuto della faccia nascosta viene scelto prima di girarla
const turns = ref(0)
const faces = ref(['chip', 'chip'])
const cooling = ref(false)
let coolTimer
const current = computed(() => faces.value[turns.value % 2])

function show(kind, back = false) {
  const next = turns.value + (back ? -1 : 1)
  const f = [...faces.value]
  f[((next % 2) + 2) % 2] = kind
  faces.value = f
  turns.value = next
}

function offerSnap() {
  if (current.value === 'chip' && !cooling.value) show('snap')
}

function onEnter(e) {
  if (e.pointerType === 'mouse') offerSnap()
}
function onFocus(e) {
  // solo da tastiera: col mouse ci pensa già l'hover
  if (e.target.matches(':focus-visible')) offerSnap()
}
function onLeave() {
  if (current.value === 'snap') show('chip', true)
}

function onClick() {
  if (current.value === 'snap') {
    setSnap('snapped')
    show('sacrifice')
  } else if (current.value === 'sacrifice') {
    setSnap('normal')
    show('chip')
    cooling.value = true
    clearTimeout(coolTimer)
    coolTimer = setTimeout(() => (cooling.value = false), COOLDOWN)
  } else {
    // touch o tastiera: il primo tocco gira la chip, il secondo schiocca
    offerSnap()
  }
}

onUnmounted(() => {
  clearTimeout(coolTimer)
  setSnap('normal', true)
})
</script>

<style scoped>
.snap-chip {
  display: inline-block;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  cursor: pointer;
  perspective: 600px;
  border-radius: 100px;
}
.snap-chip.cooling {
  cursor: default;
}
.snap-chip:focus-visible {
  outline: 2px solid var(--gold);
  outline-offset: 4px;
}

.snap-inner {
  display: grid;
  transform-style: preserve-3d;
  transition: transform 0.6s cubic-bezier(0.4, 0.2, 0.2, 1);
}

.snap-face {
  grid-area: 1 / 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 20px;
  border-radius: 100px;
  border: 1px solid var(--border-gold);
  background: var(--gold-subtle);
  color: var(--gold);
  font-size: 0.88rem;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.snap-face i {
  font-size: 0.8rem;
}
.snap-sizer {
  visibility: hidden;
}
.back {
  transform: rotateY(180deg);
}

/* colori ispirati al titano viola: viola profondo e oro */
.is-snap {
  background: linear-gradient(135deg, #3b1260, #6a2c91 55%, #4a1a72);
  border-color: #e8b923;
  color: #ffd54a;
  box-shadow: 0 0 18px rgba(138, 63, 190, 0.55), inset 0 0 10px rgba(232, 185, 35, 0.25);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

/* colori ispirati all'armatura: rosso acceso e oro */
.is-sacrifice {
  background: linear-gradient(135deg, #8e0e0e, #c8231c 50%, #8e0e0e);
  border-color: #f2c14e;
  color: #ffe08a;
  box-shadow: 0 0 18px rgba(214, 40, 30, 0.55), inset 0 0 0 2px rgba(242, 193, 78, 0.35);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}
.is-sacrifice i {
  color: #7fe7ff;
  filter: drop-shadow(0 0 4px #7fe7ff);
}

@media (prefers-reduced-motion: reduce) {
  .snap-inner {
    transition-duration: 0.2s;
  }
}
</style>
