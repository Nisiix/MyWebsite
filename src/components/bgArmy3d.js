// Esercito di Nova Ward di "Schiocca le dita" (la logica dei movimenti è in bgSnap.js).
//
// I robottini sono piccoli (circa una cella) e possono essere una sessantina: disegnarli
// tutti in 3D a ogni fotogramma costerebbe mezzo milione di triangoli e un canvas WebGL a
// tutto schermo. Si usa invece la tecnica degli "impostor": il modello 3D vero viene
// renderizzato una volta sola, con Three.js, da 24 angolazioni e in 5 pose (fermo e 4 fasi
// del volo), dentro un'unica immagine (atlante). Poi ogni robottino è un drawImage sul
// canvas dello sfondo, che sceglie la vista giusta per come è girato in quel momento.
//
// L'atlante si prepara a pezzetti nei momenti in cui il browser è libero, dopo che la pagina
// si è mostrata; finché non è pronto (o senza WebGL) si usa l'immagine statica.

import { loadNova, makeRenderer, makeStage, MODEL_H, MODEL_CY } from './novaModel'

const YAWS = 24 // angolazioni (ogni 15°)
const POSES = 5 // 0 = fermo, 1-4 = fasi del volo
const TILE = 128 // lato di una vista, in pixel
const HALF = MODEL_H * 0.62 // metà dell'inquadratura, in unità del modello
const FILL = MODEL_H / (HALF * 2) // quota della vista occupata dall'altezza del robottino
const SIZE = 0.95 // altezza di un robottino, in celle
const CHUNK = 6 // viste renderizzate per ogni pausa del browser
const POSED = ['Body', 'Head', 'Shoulder_L', 'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Hip_L', 'Hip_R', 'Knee_L', 'Knee_R']

const idle = (fn) =>
  new Promise((resolve) => {
    if ('requestIdleCallback' in window) requestIdleCallback(() => resolve(fn()), { timeout: 300 })
    else setTimeout(() => resolve(fn()), 16)
  })

// Posa di una fase: 0 fermo (braccia rilassate), 1-4 in volo (gambe indietro che oscillano)
function pose(nodes, base, frame) {
  for (const [n, rot] of base) n.rotation.copy(rot)
  const m = frame ? 1 : 0
  const ph = ((frame - 1) / 4) * Math.PI * 2
  const sw = m * Math.sin(ph)
  if (nodes.Shoulder_L) nodes.Shoulder_L.rotation.z -= 0.3 + 0.12 * m
  if (nodes.Shoulder_R) nodes.Shoulder_R.rotation.z += 0.3 + 0.12 * m
  if (nodes.Shoulder_L) nodes.Shoulder_L.rotation.x += 0.35 * m + 0.12 * sw
  if (nodes.Shoulder_R) nodes.Shoulder_R.rotation.x += 0.35 * m - 0.12 * sw
  if (nodes.Elbow_L) nodes.Elbow_L.rotation.x -= 0.3 + 0.2 * m
  if (nodes.Elbow_R) nodes.Elbow_R.rotation.x -= 0.3 + 0.2 * m
  if (nodes.Hip_L) nodes.Hip_L.rotation.x += 0.45 * m + 0.16 * sw
  if (nodes.Hip_R) nodes.Hip_R.rotation.x += 0.3 * m - 0.16 * sw
  if (nodes.Knee_L) nodes.Knee_L.rotation.x -= 0.15 + 0.45 * m
  if (nodes.Knee_R) nodes.Knee_R.rotation.x -= 0.1 + 0.35 * m
}

export function createArmy3D() {
  let state = 'idle' // idle | loading | ready | fallback
  let atlas = null // canvas 2D con tutte le viste
  let done = 0 // viste già pronte (si riempiono per posa, poi per angolazione)
  let gen = 0 // cambia a ogni dispose: un atlante a metà di un montaggio precedente si ferma

  async function build() {
    if (state !== 'idle') return
    state = 'loading'
    const my = gen
    const disposedNow = () => my !== gen
    let renderer
    try {
      const nova = await loadNova()
      if (disposedNow()) return
      const { THREE } = nova
      renderer = makeRenderer(THREE)
      renderer.setPixelRatio(1)
      renderer.setSize(TILE, TILE, false)
      const { scene, env } = makeStage(THREE, nova.RoomEnvironment, renderer)
      const camera = new THREE.OrthographicCamera(-HALF, HALF, HALF, -HALF, 0.1, 100)
      // un po' dall'alto, come la griglia dello sfondo
      camera.position.set(0, MODEL_CY + 3.5, 20)
      camera.lookAt(0, MODEL_CY, 0)
      const rig = nova.template.clone()
      scene.add(rig)
      const nodes = {}
      const base = new Map()
      for (const name of POSED) {
        const n = rig.getObjectByName(name)
        if (!n) continue
        nodes[name] = n
        base.set(n, n.rotation.clone())
      }
      for (const m of nova.glow) m.emissiveIntensity = 1.35

      atlas = document.createElement('canvas')
      atlas.width = TILE * YAWS
      atlas.height = TILE * POSES
      const actx = atlas.getContext('2d')
      // prima la posa da fermo, poi quelle di volo: le prime servono subito
      for (let p = 0; p < POSES; p++) {
        for (let k = 0; k < YAWS; k += CHUNK) {
          await idle(() => {
            if (disposedNow()) return
            pose(nodes, base, p)
            for (let y = k; y < Math.min(k + CHUNK, YAWS); y++) {
              rig.rotation.y = (y / YAWS) * Math.PI * 2
              renderer.render(scene, camera)
              actx.drawImage(renderer.domElement, y * TILE, p * TILE)
            }
          })
          if (disposedNow()) return
        }
        done = p + 1
        if (p === 0) state = 'ready'
      }
      env.dispose()
    } catch (err) {
      if (!disposedNow()) {
        console.warn('Viste 3D dei Nova Ward non disponibili, uso l’immagine statica.', err)
        if (state !== 'ready') state = 'fallback'
      }
    } finally {
      // l'atlante è pronto: il contesto WebGL non serve più
      renderer?.dispose()
      renderer?.forceContextLoss()
    }
  }

  // pronto? (la prima volta comincia a preparare le viste)
  function ready() {
    if (state === 'idle') build()
    return state === 'ready'
  }

  // robots: [{ x, y, yaw, lean: [lx, ly], moving (0..1), seed }] in pixel dello schermo
  function draw(ctx, robots, cell, t) {
    if (state !== 'ready') return false
    const size = (cell * SIZE) / FILL
    const full = Math.PI * 2
    for (const r of robots) {
      if (r.x < -cell || r.y < -cell || r.x > ctx.canvas.width + cell) continue
      const k = Math.round((((r.yaw % full) + full) % full) / (full / YAWS)) % YAWS
      // in volo: 4 fasi che si alternano; se non sono ancora pronte, la posa da fermo
      let p = 0
      if (r.moving > 0.5) {
        const f = 1 + (Math.floor(t * 8 + r.seed) % 4)
        if (f < done) p = f
      }
      const bob = Math.sin(t * 2.4 + r.seed) * cell * 0.04
      ctx.save()
      ctx.translate(r.x, r.y + bob)
      ctx.rotate(r.lean[0] * 0.25)
      ctx.drawImage(atlas, k * TILE, p * TILE, TILE, TILE, -size / 2, -size / 2 - cell * 0.02, size, size)
      ctx.restore()
    }
    return true
  }

  function dispose() {
    gen++
    atlas = null
    done = 0
    state = 'idle'
  }

  return { ready, draw, dispose }
}
