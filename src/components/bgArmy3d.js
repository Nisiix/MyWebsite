// Esercito di Nova Ward 3D di "Schiocca le dita" (la logica dei movimenti è in bgSnap.js).
//
// Sono lo stesso modello 3D del robottino che vola, renderizzato in tempo reale, ma una
// sessantina alla volta. Per restare fluidi:
// - un solo canvas WebGL per tutti, con InstancedMesh: ogni pezzo del modello è una sola
//   chiamata di disegno per tutti i robottini;
// - i pezzi rigidi attaccati alla stessa articolazione e con lo stesso materiale sono
//   uniti in un'unica geometria (da 98 a una cinquantina di chiamate);
// - le 23 sfere delle giunture e delle dita usano una versione con meno triangoli
//   (a quella dimensione la differenza non si vede): da 10.440 a circa 4.900 triangoli;
// - su schermi piccoli un modello senza i dettagli minuscoli (livello di dettaglio);
// - si ridisegna solo il rettangolo dello schermo dove ci sono robottini;
// - renderer, geometrie e shader si preparano in anticipo, quando il browser è libero.
// Senza WebGL (o con il contesto perso) bgSnap disegna l'immagine statica del personaggio.

import { loadNova, makeRenderer, makeStage, MODEL_H, MODEL_CY } from './novaModel'

const MAX = 96 // robottini al massimo (la scritta più lunga ne usa circa 60)
const SIZE = 0.95 // altezza di un robottino, in celle
const MAX_DPR = 1.5
const SPHERE_TRIS = 320 // le sfere del GLB (icosfere): si sostituiscono con una da 80
// livello di dettaglio: con celle piccole (mobile) i robottini sono alti una ventina di pixel
// e dita, prese d'aria e rifiniture non si vedono: si usa un modello senza
const LOW_CELL = 34
const DETAIL = /^(Finger|Thumb|Vent|Rib|Ab_|Jaw_vent|Brow|Temple_light|Shoulder_trim|Hip_trim|Shin_trim|Shin_panel|Gauntlet_panel|Boot_LED|Boot_toe|Chin)/
const POSED = ['Body', 'Head', 'Shoulder_L', 'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Hip_L', 'Hip_R', 'Knee_L', 'Knee_R']

// Autovettori di una matrice 3x3 simmetrica (metodo di Jacobi): assi dell'ellissoide
function eigenAxes(m) {
  const a = m.map((r) => [...r])
  const v = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1]
  ]
  for (let sweep = 0; sweep < 12; sweep++) {
    for (const [p, q] of [
      [0, 1],
      [0, 2],
      [1, 2]
    ]) {
      if (Math.abs(a[p][q]) < 1e-12) continue
      const th = 0.5 * Math.atan2(2 * a[p][q], a[q][q] - a[p][p])
      const c = Math.cos(th)
      const s = Math.sin(th)
      for (let k = 0; k < 3; k++) {
        const akp = a[k][p]
        const akq = a[k][q]
        a[k][p] = c * akp - s * akq
        a[k][q] = s * akp + c * akq
      }
      for (let k = 0; k < 3; k++) {
        const apk = a[p][k]
        const aqk = a[q][k]
        a[p][k] = c * apk - s * aqk
        a[q][k] = s * apk + c * aqk
      }
      for (let k = 0; k < 3; k++) {
        const vkp = v[k][p]
        const vkq = v[k][q]
        v[k][p] = c * vkp - s * vkq
        v[k][q] = s * vkp + c * vkq
      }
    }
  }
  // colonne di v = assi
  return [0, 1, 2].map((i) => [v[0][i], v[1][i], v[2][i]])
}

// Stessa sfera (o ellissoide) con meno triangoli: centro, assi e raggi presi dai vertici
function lowPolySphere(THREE, geometry) {
  const pos = geometry.attributes.position
  const n = pos.count
  const c = [0, 0, 0]
  for (let i = 0; i < n; i++) {
    c[0] += pos.getX(i) / n
    c[1] += pos.getY(i) / n
    c[2] += pos.getZ(i) / n
  }
  const cov = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ]
  for (let i = 0; i < n; i++) {
    const d = [pos.getX(i) - c[0], pos.getY(i) - c[1], pos.getZ(i) - c[2]]
    for (let r = 0; r < 3; r++) for (let k = 0; k < 3; k++) cov[r][k] += d[r] * d[k]
  }
  const axes = eigenAxes(cov)
  const radii = axes.map((ax) => {
    let max = 0
    for (let i = 0; i < n; i++) {
      const p = (pos.getX(i) - c[0]) * ax[0] + (pos.getY(i) - c[1]) * ax[1] + (pos.getZ(i) - c[2]) * ax[2]
      max = Math.max(max, Math.abs(p))
    }
    return max
  })
  const low = new THREE.IcosahedronGeometry(1, 1).toNonIndexed()
  low.deleteAttribute('normal')
  low.deleteAttribute('uv')
  const m = new THREE.Matrix4().set(
    axes[0][0] * radii[0], axes[1][0] * radii[1], axes[2][0] * radii[2], c[0],
    axes[0][1] * radii[0], axes[1][1] * radii[1], axes[2][1] * radii[2], c[1],
    axes[0][2] * radii[0], axes[1][2] * radii[1], axes[2][2] * radii[2], c[2],
    0, 0, 0, 1
  )
  low.applyMatrix4(m)
  return low
}

// Unisce i pezzi rigidi con la stessa articolazione e lo stesso materiale
function mergeParts(THREE, rig, low) {
  const groups = new Map()
  rig.updateMatrixWorld(true)
  rig.traverse((o) => {
    if (!o.isMesh || (low && DETAIL.test(o.name))) return
    const key = o.parent.uuid + '|' + o.material.uuid
    if (!groups.has(key)) groups.set(key, { node: o.parent, material: o.material, geos: [] })
    const tris = o.geometry.attributes.position.count / 3
    let g = tris === SPHERE_TRIS && !o.geometry.index ? lowPolySphere(THREE, o.geometry) : o.geometry.clone()
    if (g.index) g = g.toNonIndexed()
    for (const name of Object.keys(g.attributes)) if (name !== 'position') g.deleteAttribute(name)
    g.applyMatrix4(o.matrix) // nello spazio dell'articolazione
    groups.get(key).geos.push(g)
  })
  const parts = []
  for (const { node, material, geos } of groups.values()) {
    const total = geos.reduce((s, g) => s + g.attributes.position.array.length, 0)
    const arr = new Float32Array(total)
    let off = 0
    for (const g of geos) {
      arr.set(g.attributes.position.array, off)
      off += g.attributes.position.array.length
      g.dispose()
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(arr, 3))
    parts.push({ node, material, geometry })
  }
  return parts
}

export function createArmy3D() {
  let host = null
  let state = 'idle' // idle | loading | ready | fallback
  let THREE, renderer, canvas, scene, env, camera, rig, nodes, base, parts, glow
  let lods = null // { full: [...], low: [...] }
  let w = 0
  let h = 0
  let dpr = 1
  let prev = null // rettangolo disegnato al fotogramma prima (da pulire)
  let gen = 0

  function mount(el) {
    host = el
  }

  async function load() {
    if (state !== 'idle' || !host) return
    state = 'loading'
    const my = gen
    const gone = () => my !== gen
    try {
      const nova = await loadNova()
      if (gone()) return
      THREE = nova.THREE
      renderer = makeRenderer(THREE)
      renderer.autoClear = false
      canvas = renderer.domElement
      canvas.className = 'army-3d'
      canvas.setAttribute('aria-hidden', 'true')
      canvas.style.display = 'none'
      canvas.addEventListener('webglcontextlost', onLost)
      host.append(canvas)
      ;({ scene, env } = makeStage(THREE, nova.RoomEnvironment, renderer))
      // camera ortografica in pixel dello schermo (y verso il basso diventa -y)
      camera = new THREE.OrthographicCamera(0, 1, 0, -1, 1, 10000)
      camera.position.z = 5000

      // scheletro da mettere in posa per ogni robottino; i pezzi si copiano nelle istanze
      rig = nova.template.clone()
      rig.rotation.order = 'ZYX'
      nodes = {}
      base = new Map()
      for (const name of POSED) {
        const n = rig.getObjectByName(name)
        if (!n) continue
        nodes[name] = n
        base.set(n, n.rotation.clone())
      }
      const build = (low) =>
        mergeParts(THREE, rig, low).map((p) => {
          const inst = new THREE.InstancedMesh(p.geometry, p.material, MAX)
          inst.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
          inst.frustumCulled = false
          inst.count = 0
          inst.visible = !low
          scene.add(inst)
          return { ...p, inst }
        })
      lods = { full: build(false), low: build(true) }
      parts = lods.full
      glow = nova.glow
      // compila subito gli shader, così il primo fotogramma non si inceppa
      if (renderer.compileAsync) await renderer.compileAsync(scene, camera)
      if (gone()) return
      state = 'ready'
    } catch (err) {
      if (!gone()) {
        console.warn('Esercito Nova Ward 3D non disponibile, uso l’immagine statica.', err)
        state = 'fallback'
        if (canvas) canvas.style.display = 'none'
      }
    }
  }

  function onLost(e) {
    e.preventDefault()
    state = 'fallback'
    canvas.style.display = 'none'
  }

  // pronto? (la prima volta comincia a preparare renderer e geometrie)
  function ready() {
    if (state === 'idle') load()
    return state === 'ready'
  }

  function hide() {
    if (canvas && canvas.style.display !== 'none') {
      canvas.style.display = 'none'
      // la prossima volta si riparte da un canvas pulito
      renderer.setScissorTest(false)
      renderer.clear()
      prev = null
    }
  }

  function resize(view) {
    const r = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    if (view.width === w && view.height === h && r === dpr) return
    w = view.width
    h = view.height
    dpr = r
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.right = w
    camera.bottom = -h
    camera.updateProjectionMatrix()
    prev = null
  }

  // Un robottino: in volo si piega verso dove va con le gambe che restano indietro e
  // oscillano, fermo al suo posto respira, ondeggia e si guarda intorno.
  function pose(r, t) {
    for (const [n, rot] of base) n.rotation.copy(rot)
    const m = r.moving
    const ph = t * 7 + r.seed
    const idle = 1 - m
    const sway = Math.sin(t * 1.6 + r.seed)
    const sw = m * Math.sin(ph)
    if (nodes.Shoulder_L) {
      nodes.Shoulder_L.rotation.z -= 0.3 + 0.12 * m + 0.03 * idle * sway
      nodes.Shoulder_L.rotation.x += 0.35 * m + 0.12 * sw
    }
    if (nodes.Shoulder_R) {
      nodes.Shoulder_R.rotation.z += 0.3 + 0.12 * m + 0.03 * idle * sway
      nodes.Shoulder_R.rotation.x += 0.35 * m - 0.12 * sw
    }
    if (nodes.Elbow_L) nodes.Elbow_L.rotation.x -= 0.3 + 0.2 * m
    if (nodes.Elbow_R) nodes.Elbow_R.rotation.x -= 0.3 + 0.2 * m
    if (nodes.Hip_L) nodes.Hip_L.rotation.x += 0.45 * m + 0.16 * sw
    if (nodes.Hip_R) nodes.Hip_R.rotation.x += 0.3 * m - 0.16 * sw
    if (nodes.Knee_L) nodes.Knee_L.rotation.x -= 0.15 + 0.45 * m
    if (nodes.Knee_R) nodes.Knee_R.rotation.x -= 0.1 + 0.35 * m
    if (nodes.Head) nodes.Head.rotation.y += 0.2 * idle * Math.sin(t * 0.7 + r.seed * 2)
    if (nodes.Body) nodes.Body.rotation.z += 0.03 * idle * sway
  }

  // robots: [{ x, y, yaw, lean: [lx, ly], moving (0..1), seed }] in pixel dello schermo
  function draw(robots, view, t) {
    if (state !== 'ready') return false
    resize(view)
    const cell = view.cell
    const want = cell < LOW_CELL ? lods.low : lods.full
    if (want !== parts) {
      for (const p of parts) p.inst.visible = false
      for (const p of want) p.inst.visible = true
      parts = want
    }
    const s = (cell * SIZE) / MODEL_H
    let i = 0
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const r of robots) {
      if (i >= MAX) break
      if (r.x < -cell || r.x > w + cell || r.y < -cell || r.y > h + cell) continue
      pose(r, t)
      const bob = Math.sin(t * 2.4 + r.seed) * cell * 0.04
      const y = r.y + bob
      rig.scale.setScalar(s)
      // il centro del modello sul centro della cella; chi è più in basso sta davanti
      rig.position.set(r.x, -y - MODEL_CY * s, y)
      rig.rotation.set(0.18 + r.lean[1] * 0.35, r.yaw, -r.lean[0] * 0.3)
      rig.updateMatrixWorld(true)
      for (const p of parts) p.inst.setMatrixAt(i, p.node.matrixWorld)
      x0 = Math.min(x0, r.x - cell)
      x1 = Math.max(x1, r.x + cell)
      y0 = Math.min(y0, y - cell)
      y1 = Math.max(y1, y + cell)
      i++
    }
    if (!i) {
      hide()
      return true
    }
    for (const p of parts) {
      p.inst.count = i
      p.inst.instanceMatrix.needsUpdate = true
    }
    for (const m of glow) m.emissiveIntensity = 1.3 + 0.15 * Math.sin(t * 2.3)

    // si pulisce e ridisegna solo l'area con i robottini (più quella del fotogramma prima)
    const box = { x0: Math.max(0, x0), y0: Math.max(0, y0), x1: Math.min(w, x1), y1: Math.min(h, y1) }
    const area = prev
      ? { x0: Math.min(box.x0, prev.x0), y0: Math.min(box.y0, prev.y0), x1: Math.max(box.x1, prev.x1), y1: Math.max(box.y1, prev.y1) }
      : { x0: 0, y0: 0, x1: w, y1: h }
    prev = box
    renderer.setScissorTest(true)
    // lo scissor di WebGL parte dal basso
    renderer.setScissor(area.x0, h - area.y1, area.x1 - area.x0, area.y1 - area.y0)
    renderer.clear()
    renderer.render(scene, camera)
    canvas.style.display = 'block'
    return true
  }

  function dispose() {
    gen++
    if (canvas) {
      canvas.removeEventListener('webglcontextlost', onLost)
      canvas.remove()
    }
    for (const p of [...(lods?.full ?? []), ...(lods?.low ?? [])]) {
      p.inst.dispose()
      p.geometry.dispose()
    }
    lods = null
    env?.dispose()
    renderer?.dispose()
    renderer = canvas = scene = camera = rig = parts = env = null
    w = h = 0
    prev = null
    state = 'idle'
  }

  return { mount, ready, draw, hide, dispose }
}
