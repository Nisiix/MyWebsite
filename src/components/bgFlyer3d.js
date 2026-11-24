// Personaggio 3D (Nova Ward) del robottino che vola nello sfondo della home.
// bgFlyer.js decide dove vola; qui lo si disegna con Three.js in un piccolo canvas trasparente
// che segue la sua posizione. Three.js e il modello si caricano solo al primo volo.
// Se WebGL non c'è, il modello non si carica o il contesto si perde, al suo posto vola
// un'immagine statica del personaggio.

import { loadNova, makeRenderer, makeStage, fallbackUrl, MODEL_H, MODEL_CY } from './novaModel'
import { rigNodes, createPose, flightPose, trackPointer, JETS } from './novaPose'

const HEIGHT = 1.5 // altezza del personaggio, in celle della griglia
const BOX = 2.6 // lato del canvas, in celle (lascia spazio a braccia e inclinazione)
const MAX_DPR = 2

export function createFlyer3D() {
  let host = null // livello a tutto schermo dentro lo sfondo
  let canvas = null
  let img = null
  let state = 'idle' // idle | loading | ready | fallback
  let THREE = null
  let renderer, scene, camera, pivot, model, env
  let nodes = {}
  let base = new Map()
  let glow = []
  let size = 0
  let disposed = false
  let poseState = createPose()
  let current = null

  function mount(el) {
    host = el
    disposed = false
  }

  async function load() {
    if (state !== 'idle' || !host) return
    state = 'loading'
    try {
      const nova = await loadNova()
      if (disposed) return
      THREE = nova.THREE
      renderer = makeRenderer(THREE)
      canvas = renderer.domElement
      canvas.className = 'flyer-3d'
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.display = 'none'
      canvas.addEventListener('webglcontextlost', onLost)
      host.append(canvas)
      ;({ scene, env } = makeStage(THREE, nova.RoomEnvironment, renderer))

      // camera ortografica: il personaggio ha sempre la stessa altezza in pixel
      const half = (MODEL_H * BOX) / HEIGHT / 2
      camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100)
      camera.position.set(0, MODEL_CY + 0.6, 20)
      camera.lookAt(0, MODEL_CY, 0)

      pivot = new THREE.Group()
      scene.add(pivot)

      // copia del modello: geometrie e materiali restano condivisi
      model = nova.template.clone()
      model.position.y = -MODEL_CY
      pivot.position.y = MODEL_CY
      pivot.add(model)
      ;({ nodes, base } = rigNodes(model))
      glow = nova.glow
      trackPointer()
      state = 'ready'
    } catch (err) {
      if (!disposed) {
        console.warn('Nova Ward 3D non disponibile, uso l’immagine statica.', err)
        useFallback()
      }
    }
  }

  function onLost(e) {
    e.preventDefault()
    useFallback()
  }

  function useFallback() {
    state = 'fallback'
    if (canvas) canvas.style.display = 'none'
    if (!img && host) {
      img = document.createElement('img')
      img.src = fallbackUrl
      img.alt = ''
      img.className = 'flyer-3d flyer-fallback'
      img.setAttribute('aria-hidden', 'true')
      img.decoding = 'async'
      img.style.display = 'none'
      host.append(img)
    }
  }

  // pronto a volare? (al primo controllo inizia a caricare)
  function ready() {
    if (state === 'idle') load()
    return state === 'ready' || state === 'fallback'
  }

  function hide() {
    if (canvas) canvas.style.display = 'none'
    if (img) img.style.display = 'none'
  }

  function place(el, x, y, px) {
    el.style.display = 'block'
    el.style.width = `${px}px`
    el.style.height = `${px}px`
    el.style.transform = `translate3d(${x - px / 2}px, ${y - px / 2}px, 0)`
  }

  // Disegna il personaggio centrato in (x, y). Restituisce i punti da cui escono le
  // fiammelle (piedi e mani) in coordinate dello schermo, o null.
  // zoom: un po' più grande quando vola più in alto (più vicino a chi guarda)
  function draw(f, x, y, cell, clock, thrust, light, dt, motion, zoom = 1) {
    const px = Math.round(cell * BOX)
    if (state === 'fallback') {
      if (!img) return null
      place(img, x, y, px * f.scale * zoom)
      img.style.transform += ` scaleX(${f.face})`
      return null
    }
    if (state !== 'ready') return null
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    if (px !== size) {
      size = px
      renderer.setPixelRatio(dpr)
      renderer.setSize(px, px, false)
    }
    place(canvas, x, y, px)

    // nuovo volo: le molle ripartono dalla posa di adesso
    if (f !== current) {
      current = f
      poseState = createPose()
    }

    pivot.scale.setScalar(Math.max(0.001, f.scale * zoom))
    renderer.toneMappingExposure = light ? 0.95 : 1.05
    const sp = cell * 2.6
    const acc = sp * 2.4
    const body = flightPose(
      poseState,
      nodes,
      base,
      { vx: f.vx / sp, vy: (f.vy + (f.lv || 0) * 0.6) / sp, ax: f.ax / acc, ay: f.ay / acc, face: f.face, t: clock + f.seed, x, y, cell },
      dt
    )
    pivot.rotation.set(body.pitch, body.yaw, body.roll, 'ZYX')
    for (const m of glow) m.emissiveIntensity = 1.2 + 0.35 * body.thrust + 0.08 * Math.sin((clock + f.seed) * 2.3)
    renderer.render(scene, camera)

    // punti delle fiammelle, proiettati sullo schermo
    const out = {}
    const v = new THREE.Vector3()
    for (const key of JETS) {
      const node = nodes[key]
      if (!node) continue
      node.getWorldPosition(v).project(camera)
      out[key] = [x + (v.x * px) / 2, y - (v.y * px) / 2]
    }
    return out
  }

  function dispose() {
    disposed = true
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.remove()
    }
    env?.dispose()
    renderer?.dispose()
    img?.remove()
    canvas = img = renderer = scene = camera = pivot = model = env = null
    glow = []
    base = new Map()
    nodes = {}
    size = 0
    state = 'idle'
  }

  return { mount, ready, draw, hide, dispose }
}
