// Posa di volo del Nova Ward, la stessa per il robottino che vola da solo (bgFlyer3d.js) e per
// i robottini di "Schiocca le dita" (bgArmy3d.js), così hanno lo stesso aspetto e lo stesso
// modo di muoversi.
//
// Dalla velocità e dall'accelerazione si calcola una posa ideale; corpo e arti la inseguono
// con molle smorzate (un po' di ritardo e di rimbalzo invece di scatti):
// - si inclina nelle curve e si gira di tre quarti verso dove va
// - accelerando le braccia restano indietro e le gambe si allungano dietro, frenando
//   il corpo si raddrizza e le gambe tornano sotto
// - salendo spinge con i palmi verso il basso, scendendo si sporge in avanti
// - sospeso a mezz'aria respira e ondeggia, gambe che si muovono appena
// - la testa guarda verso il mouse

export const POSED = ['Head', 'Body', 'Shoulder_L', 'Shoulder_R', 'Elbow_L', 'Elbow_R', 'Hip_L', 'Hip_R', 'Knee_L', 'Knee_R']
export const JETS = ['Sole_L', 'Sole_R', 'Palm_emitter_L', 'Palm_emitter_R'] // da dove escono le fiammelle

// posizione del mouse, condivisa
export const pointer = { x: -1e4, y: -1e4 }
let tracking = false
export function trackPointer() {
  if (tracking) return
  tracking = true
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.x = e.clientX
      pointer.y = e.clientY
    },
    { passive: true }
  )
}

// Nodi del modello da mettere in posa, con la loro rotazione di partenza
export function rigNodes(model) {
  const nodes = {}
  const base = new Map()
  for (const name of [...POSED, ...JETS]) {
    const n = model.getObjectByName(name)
    if (!n) continue
    nodes[name] = n
    if (POSED.includes(name)) base.set(n, n.rotation.clone())
  }
  return { nodes, base }
}

// stato di un personaggio: molle e sguardo
export function createPose() {
  return { springs: {}, look: { x: 0, y: 0 } }
}

function spring(st, name, target, dt, k, z) {
  const s = (st.springs[name] ??= { x: target, v: 0 })
  const c = 2 * Math.sqrt(k) * z
  s.v += (k * (target - s.x) - c * s.v) * dt
  s.x += s.v * dt
  return s.x
}

// m: { vx, vy, ax, ay } normalizzati (1 = velocità / accelerazione massima),
//    face (1 guarda a destra, -1 a sinistra), t (orologio + seme), x, y, cell (pixel sullo
//    schermo, per lo sguardo verso il mouse)
// Mette in posa i nodi e restituisce la rotazione del corpo { pitch, yaw, roll } e la spinta.
export function flightPose(st, nodes, base, m, dt) {
  const { vx, vy, t } = m
  const ax = Math.max(-1.5, Math.min(1.5, m.ax))
  const ay = Math.max(-1.5, Math.min(1.5, m.ay))
  const speed = Math.min(1, Math.hypot(vx, vy))
  const fwd = vx * m.face // velocità nel verso in cui guarda
  const fwdAcc = ax * m.face
  const calm = 1 - speed
  const breathe = Math.sin(t * 1.7)
  const T = {
    yaw: m.face * (0.5 + 0.12 * Math.min(1, Math.abs(vx))) + 0.06 * Math.sin(t * 0.7),
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
  // il mouse, relativo al personaggio, orienta la testa
  const lx = Math.max(-1, Math.min(1, (pointer.x - m.x) / (m.cell * 8)))
  const ly = Math.max(-1, Math.min(1, (pointer.y - m.y) / (m.cell * 8)))
  const lk = Math.min(1, dt * 5)
  st.look.x += (lx - st.look.x) * lk
  st.look.y += (ly - st.look.y) * lk

  // passi piccoli: la molla resta stabile anche con un fotogramma lungo
  let left = Math.min(dt, 0.5)
  const s = {}
  do {
    const h = Math.min(left, 1 / 60)
    left -= h
    s.yaw = spring(st, 'yaw', T.yaw, h, 18, 0.55)
    s.roll = spring(st, 'roll', T.roll, h, 26, 0.5)
    s.pitch = spring(st, 'pitch', T.pitch, h, 22, 0.55)
    s.armBack = spring(st, 'armBack', T.armBack, h, 20, 0.35)
    s.armOpen = spring(st, 'armOpen', T.armOpen, h, 24, 0.45)
    s.elbow = spring(st, 'elbow', T.elbow, h, 20, 0.5)
    s.legBack = spring(st, 'legBack', T.legBack, h, 12, 0.4)
    s.knee = spring(st, 'knee', T.knee, h, 14, 0.45)
    s.headX = spring(st, 'headX', T.headX, h, 30, 0.7)
  } while (left > 1e-4)

  for (const [obj, rot] of base) obj.rotation.copy(rot)
  const n = nodes
  const lag = Math.sin(t * 2.9) // gambe e braccia non sono mai perfettamente simmetriche
  if (n.Body) n.Body.rotation.z += 0.03 * calm * Math.sin(t * 0.9)
  if (n.Shoulder_L) {
    n.Shoulder_L.rotation.z -= s.armOpen + 0.03 * lag
    n.Shoulder_L.rotation.x += s.armBack
  }
  if (n.Shoulder_R) {
    n.Shoulder_R.rotation.z += s.armOpen - 0.03 * lag
    n.Shoulder_R.rotation.x += s.armBack * 0.85
  }
  if (n.Elbow_L) n.Elbow_L.rotation.x -= s.elbow
  if (n.Elbow_R) n.Elbow_R.rotation.x -= s.elbow * 1.1
  if (n.Hip_L) n.Hip_L.rotation.x += s.legBack + 0.08 + T.kick * Math.sin(t * 2.2)
  if (n.Hip_R) n.Hip_R.rotation.x += s.legBack * 0.7 + T.kick * Math.sin(t * 2.2 + 2.4)
  if (n.Knee_L) n.Knee_L.rotation.x -= s.knee + 0.12
  if (n.Knee_R) n.Knee_R.rotation.x -= s.knee * 0.75
  if (n.Head) {
    n.Head.rotation.y += st.look.x * 0.35
    n.Head.rotation.x += st.look.y * 0.2 + s.headX
  }
  const thrust = Math.min(1, 0.3 * speed + Math.hypot(ax, ay))
  return { pitch: s.pitch, yaw: s.yaw, roll: s.roll, thrust }
}
