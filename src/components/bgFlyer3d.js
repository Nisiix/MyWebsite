// Personaggio 3D (Nova Ward) del robottino che vola nello sfondo della home.
// bgFlyer.js decide dove vola; qui lo si disegna con Three.js in un piccolo canvas trasparente
// che segue la sua posizione. Three.js e il modello si caricano solo al primo volo.
// Se WebGL non c'è, il modello non si carica o il contesto si perde, al suo posto vola
// un'immagine statica del personaggio.

import { loadNova, makeRenderer, makeStage, fallbackUrl, MODEL_H, MODEL_CY } from './novaModel'

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
  const nodes = {}
  const base = new Map()
  let glow = []
  let size = 0
  let disposed = false
  const pointer = { x: 0, y: 0 }
  const look = { x: 0, y: 0 }
  let current = null

  function mount(el) {
    host = el
    disposed = false
  }

  function onPointer(e) {
    pointer.x = e.clientX
    pointer.y = e.clientY
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
      for (const name of ['Head', 'Body', 'Shoulder_L', 'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Hip_L', 'Hip_R', 'Knee_L', 'Knee_R', 'Palm_emitter_L', 'Palm_emitter_R', 'Sole_L', 'Sole_R']) {
        const node = model.getObjectByName(name)
        if (!node) continue
        nodes[name] = node
        base.set(node, node.rotation.clone())
      }
      glow = nova.glow
      window.addEventListener('pointermove', onPointer, { passive: true })
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

  // Molle smorzate: il corpo e gli arti inseguono la posa ideale con un po' di ritardo
  // e di rimbalzo, invece di scattare. k = rigidezza, z = smorzamento (1 = senza rimbalzo).
  const springs = {}
  function spring(name, target, dt, k, z) {
    const s = (springs[name] ??= { x: target, v: 0 })
    const c = 2 * Math.sqrt(k) * z
    s.v += (k * (target - s.x) - c * s.v) * dt
    s.x += s.v * dt
    return s.x
  }

  // Posa di volo, calcolata da velocità e accelerazione:
  // - si inclina nelle curve e si gira di tre quarti verso dove va, con un po' di rimbalzo
  // - accelerando le braccia restano indietro e le gambe si allungano dietro, frenando
  //   il corpo si raddrizza e le gambe tornano sotto
  // - salendo spinge con i palmi verso il basso, scendendo si sporge in avanti
  // - sospeso a mezz'aria respira e ondeggia, gambe che si muovono appena
  function pose(f, clock, cell, dt) {
    const sp = cell * 2.6
    const acc = sp * 2.4
    const vx = f.vx / sp
    const vy = f.vy / sp
    const ax = f.ax / acc
    const ay = f.ay / acc
    const speed = Math.min(1, Math.hypot(vx, vy))
    const fwd = vx * f.face // velocità nel verso in cui guarda
    const fwdAcc = ax * f.face
    const t = clock + f.seed
    const calm = 1 - speed
    const breathe = Math.sin(t * 1.7)
    const T = {
      yaw: f.face * (0.5 + 0.12 * Math.min(1, Math.abs(vx))) + 0.06 * Math.sin(t * 0.7),
      roll: -(0.3 * vx + 0.14 * ax) + 0.03 * calm * Math.sin(t * 1.1),
      pitch: 0.16 * vy + 0.1 * ay + 0.025 * calm * breathe,
      armBack: 0.45 * fwdAcc + 0.2 * fwd,
      armOpen: 0.42 + 0.18 * Math.max(0, -ay) + 0.04 * calm * breathe,
      elbow: 0.25 + 0.25 * speed,
      legBack: 0.35 * Math.max(0, fwd) + 0.2 * speed,
      knee: 0.2 + 0.45 * speed + 0.15 * Math.max(0, -ay),
      headX: 0.12 * vy,
      kick: calm * 0.08
    }
    // passi piccoli: la molla resta stabile anche con un fotogramma lungo
    let left = Math.min(dt, 0.5)
    const st = {}
    do {
      const h = Math.min(left, 1 / 60)
      left -= h
      st.yaw = spring('yaw', T.yaw, h, 18, 0.55)
      st.roll = spring('roll', T.roll, h, 26, 0.5)
      st.pitch = spring('pitch', T.pitch, h, 22, 0.55)
      st.armBack = spring('armBack', T.armBack, h, 20, 0.35)
      st.armOpen = spring('armOpen', T.armOpen, h, 24, 0.45)
      st.elbow = spring('elbow', T.elbow, h, 20, 0.5)
      st.legBack = spring('legBack', T.legBack, h, 12, 0.4)
      st.knee = spring('knee', T.knee, h, 14, 0.45)
      st.headX = spring('headX', T.headX, h, 30, 0.7)
    } while (left > 1e-4)

    pivot.rotation.set(st.pitch, st.yaw, st.roll, 'ZYX')

    for (const [obj, rot] of base) obj.rotation.copy(rot)
    const n = nodes
    const lag = Math.sin(t * 2.9) // gambe e braccia non sono mai perfettamente simmetriche
    if (n.Body) n.Body.rotation.z += 0.03 * calm * Math.sin(t * 0.9)
    if (n.Shoulder_L) {
      n.Shoulder_L.rotation.z -= st.armOpen + 0.03 * lag
      n.Shoulder_L.rotation.x += st.armBack
    }
    if (n.Shoulder_R) {
      n.Shoulder_R.rotation.z += st.armOpen - 0.03 * lag
      n.Shoulder_R.rotation.x += st.armBack * 0.85
    }
    if (n.Elbow_L) n.Elbow_L.rotation.x -= st.elbow
    if (n.Elbow_R) n.Elbow_R.rotation.x -= st.elbow * 1.1
    if (n.Hip_L) n.Hip_L.rotation.x += st.legBack + 0.08 + T.kick * Math.sin(t * 2.2)
    if (n.Hip_R) n.Hip_R.rotation.x += st.legBack * 0.7 + T.kick * Math.sin(t * 2.2 + 2.4)
    if (n.Knee_L) n.Knee_L.rotation.x -= st.knee + 0.12
    if (n.Knee_R) n.Knee_R.rotation.x -= st.knee * 0.75
    if (n.Head) {
      n.Head.rotation.y += look.x * 0.35
      n.Head.rotation.x += look.y * 0.2 + st.headX
    }
    const thrust = Math.min(1, 0.3 * speed + Math.hypot(ax, ay))
    for (const m of glow) m.emissiveIntensity = 1.2 + 0.35 * thrust + 0.08 * Math.sin(t * 2.3)
  }

  // Disegna il personaggio centrato in (x, y). Restituisce i punti da cui escono le
  // fiammelle (piedi e mani) in coordinate dello schermo, o null.
  function draw(f, x, y, cell, clock, thrust, light, dt, motion) {
    const px = Math.round(cell * BOX)
    if (state === 'fallback') {
      if (!img) return null
      place(img, x, y, px * f.scale)
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

    // il mouse, relativo al personaggio, orienta la testa
    const lx = Math.max(-1, Math.min(1, (pointer.x - x) / (cell * 8)))
    const ly = Math.max(-1, Math.min(1, (pointer.y - y) / (cell * 8)))
    const k = Math.min(1, dt * 5)
    look.x += (lx - look.x) * k
    look.y += (ly - look.y) * k
    // nuovo volo: le molle ripartono dalla posa di adesso
    if (f !== current) {
      current = f
      for (const key of Object.keys(springs)) delete springs[key]
    }

    pivot.scale.setScalar(Math.max(0.001, f.scale))
    renderer.toneMappingExposure = light ? 0.95 : 1.05
    pose(f, clock, cell, dt)
    renderer.render(scene, camera)

    // punti delle fiammelle, proiettati sullo schermo
    const out = {}
    const v = new THREE.Vector3()
    for (const key of ['Sole_L', 'Sole_R', 'Palm_emitter_L', 'Palm_emitter_R']) {
      const node = nodes[key]
      if (!node) continue
      node.getWorldPosition(v).project(camera)
      out[key] = [x + (v.x * px) / 2, y - (v.y * px) / 2]
    }
    return out
  }

  function dispose() {
    disposed = true
    window.removeEventListener('pointermove', onPointer)
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.remove()
    }
    env?.dispose()
    renderer?.dispose()
    img?.remove()
    canvas = img = renderer = scene = camera = pivot = model = env = null
    glow = []
    base.clear()
    for (const k of Object.keys(nodes)) delete nodes[k]
    size = 0
    state = 'idle'
  }

  return { mount, ready, draw, hide, dispose }
}
