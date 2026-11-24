// Caricamento condiviso del personaggio 3D Nova Ward: Three.js, loader e modello si scaricano
// una sola volta (alla prima richiesta) e li usano sia il robottino che vola sia l'esercito
// di "Schiocca le dita". Geometrie e materiali sono condivisi tra tutti.

import modelUrl from '@/assets/nova/nova-ward.glb?url'
import fallbackUrl from '@/assets/nova/nova-ward.png'

export { fallbackUrl }
export const MODEL_H = 3.45 // altezza del modello in unità del GLB
export const MODEL_CY = 1.72 // centro verticale del modello

// armatura più rossa del GLB originale, che tende al rosa
const REDS = { 'Crimson enamel': 0xc8101c, 'Scarlet panel': 0xe01b26, 'Deep red': 0x7e0912 }

let promise = null

export function loadNova() {
  promise ??= (async () => {
    const [THREE, { GLTFLoader }, { RoomEnvironment }] = await Promise.all([
      import('three'),
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ])
    const gltf = await new GLTFLoader().loadAsync(modelUrl)
    const scene = gltf.scene
    const glow = new Set()
    scene.traverse((o) => {
      if (!o.isMesh) return
      for (const m of [].concat(o.material)) {
        if (REDS[m.name] !== undefined) {
          m.color.setHex(REDS[m.name])
          m.roughness = Math.min(m.roughness ?? 0.5, 0.38)
        }
        if (m.emissive && m.emissive.getHex() !== 0) glow.add(m)
      }
    })
    return { THREE, RoomEnvironment, template: scene, glow: [...glow] }
  })()
  // se fallisce, al prossimo tentativo si riprova
  promise.catch(() => (promise = null))
  return promise
}

// Scena con le luci del personaggio, per un renderer
export function makeStage(THREE, RoomEnvironment, renderer) {
  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  const room = new RoomEnvironment()
  const env = pmrem.fromScene(room, 0.04)
  scene.environment = env.texture
  room.dispose()
  pmrem.dispose()
  scene.add(new THREE.HemisphereLight(0xe4f5ff, 0x48273c, 1.1))
  const light = (color, intensity, pos) => {
    const l = new THREE.DirectionalLight(color, intensity)
    l.position.set(...pos)
    scene.add(l)
  }
  light(0xfff1e1, 2.6, [3, 6, 5])
  light(0x3acaff, 2.4, [-4, 3, -2])
  light(0xff344b, 1.2, [4, 2, -4])
  return { scene, env }
}

export function makeRenderer(THREE) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' })
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  return renderer
}

// Precarica in un momento tranquillo, dopo che la pagina si è mostrata
export function preloadNovaWhenIdle(then) {
  const go = () =>
    loadNova()
      .then(() => then && setTimeout(then, 1500))
      .catch(() => {})
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 4000 })
  else setTimeout(go, 2500)
}
