// Personaggio 3D (Nova Ward) del robottino che vola nello sfondo della home.
// bgFlyer.js decide dove vola; qui lo si disegna con Three.js in un piccolo canvas trasparente
// che segue la sua posizione. Three.js e il modello si caricano solo al primo volo.
// Se WebGL non c'è, il modello non si carica o il contesto si perde, al suo posto vola
// un'immagine statica del personaggio.

import modelUrl from '@/assets/nova/nova-ward.glb?url'
import fallbackUrl from '@/assets/nova/nova-ward.png'

const HEIGHT = 1.5 // altezza del personaggio, in celle della griglia
const BOX = 2.6 // lato del canvas, in celle (lascia spazio a braccia e inclinazione)
const MODEL_H = 3.45 // altezza del modello in unità del GLB
const MODEL_CY = 1.72 // centro verticale del modello
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
  let yaw = 0
  let disposed = false
  const pointer = { x: 0, y: 0 }
  const look = { x: 0, y: 0 }

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
      const [three, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
        import('three'),
        import('three/addons/loaders/GLTFLoader.js'),
        import('three/addons/environments/RoomEnvironment.js')
      ])
      if (disposed) return
      THREE = three
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
      renderer.setClearColor(0x000000, 0)
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      canvas = renderer.domElement
      canvas.className = 'flyer-3d'
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.display = 'none'
      canvas.addEventListener('webglcontextlost', onLost)
      host.append(canvas)

      scene = new THREE.Scene()
      const pmrem = new THREE.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      env = pmrem.fromScene(room, 0.04)
      scene.environment = env.texture
      room.dispose()
      pmrem.dispose()
      scene.add(new THREE.HemisphereLight(0xe4f5ff, 0x48273c, 1.6))
      const light = (color, intensity, pos) => {
        const l = new THREE.DirectionalLight(color, intensity)
        l.position.set(...pos)
        scene.add(l)
      }
      light(0xfff1e1, 2.6, [3, 6, 5])
      light(0x3acaff, 2.4, [-4, 3, -2])
      light(0xff344b, 1.2, [4, 2, -4])

      // camera ortografica: il personaggio ha sempre la stessa altezza in pixel
      const half = (MODEL_H * BOX) / HEIGHT / 2
      camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 100)
      camera.position.set(0, MODEL_CY + 0.6, 20)
      camera.lookAt(0, MODEL_CY, 0)

      pivot = new THREE.Group()
      scene.add(pivot)

      const gltf = await new GLTFLoader().loadAsync(modelUrl)
      if (disposed) {
        disposeModel(gltf.scene)
        return
      }
      model = gltf.scene
      model.position.y = -MODEL_CY
      pivot.position.y = MODEL_CY
      pivot.add(model)
      for (const name of ['Head', 'Body', 'Shoulder_L', 'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Hip_L', 'Hip_R', 'Knee_L', 'Knee_R', 'Palm_emitter_L', 'Palm_emitter_R', 'Sole_L', 'Sole_R']) {
        const node = model.getObjectByName(name)
        if (!node) continue
        nodes[name] = node
        base.set(node, node.rotation.clone())
      }
      const mats = new Set()
      model.traverse((o) => {
        if (o.isMesh) for (const m of [].concat(o.material)) if (m.emissive && m.emissive.getHex() !== 0) mats.add(m)
      })
      glow = [...mats]
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

  // Posa di volo: busto inclinato nel verso del moto, braccia aperte con i palmi in giù,
  // gambe leggermente piegate, testa che guarda verso il mouse.
  function pose(f, clock, thrust, cell, motion) {
    for (const [obj, rot] of base) obj.rotation.copy(rot)
    const n = nodes
    const swing = motion ? Math.sin(clock * 2.4) : 0
    if (n.Shoulder_L) n.Shoulder_L.rotation.z -= 0.42 + swing * 0.05
    if (n.Shoulder_R) n.Shoulder_R.rotation.z += 0.42 + swing * 0.05
    if (n.Shoulder_L) n.Shoulder_L.rotation.x += 0.15 * thrust
    if (n.Shoulder_R) n.Shoulder_R.rotation.x += 0.15 * thrust
    if (n.Elbow_L) n.Elbow_L.rotation.x -= 0.25
    if (n.Elbow_R) n.Elbow_R.rotation.x -= 0.25
    if (n.Hip_L) n.Hip_L.rotation.x += 0.12 + 0.18 * thrust
    if (n.Hip_R) n.Hip_R.rotation.x += 0.05 + 0.1 * thrust
    if (n.Knee_L) n.Knee_L.rotation.x -= 0.3 + 0.2 * thrust
    if (n.Knee_R) n.Knee_R.rotation.x -= 0.15 + 0.15 * thrust
    if (n.Head && motion) {
      n.Head.rotation.y += look.x * 0.35
      n.Head.rotation.x += look.y * 0.2
    }
    for (const m of glow) m.emissiveIntensity = motion ? 1.3 + 0.2 * Math.sin(clock * 2.3) : 1.3
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

    // si gira di tre quarti verso dove vola
    const targetYaw = f.face * 0.55
    yaw += (targetYaw - yaw) * Math.min(1, dt * 6)
    pivot.rotation.set(0, yaw, 0, 'ZYX')
    const tilt = Math.max(-0.35, Math.min(0.35, (f.vx / (cell * 2.6)) * 0.35))
    pivot.rotation.z = -tilt
    pivot.scale.setScalar(Math.max(0.001, f.scale))
    renderer.toneMappingExposure = light ? 1.0 : 1.12
    pose(f, clock, thrust, cell, motion)
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

  function disposeModel(object) {
    const geometries = new Set()
    const materials = new Set()
    object.traverse((o) => {
      if (o.isMesh) {
        geometries.add(o.geometry)
        for (const m of [].concat(o.material)) materials.add(m)
      }
    })
    geometries.forEach((g) => g.dispose())
    materials.forEach((m) => m.dispose())
  }

  function dispose() {
    disposed = true
    window.removeEventListener('pointermove', onPointer)
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.remove()
    }
    if (model) disposeModel(model)
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
