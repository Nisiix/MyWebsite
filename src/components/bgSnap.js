// "Schiocca le dita": un robottino Nova Ward per ogni blocco della scritta. Entrano in volo
// dai bordi laterali, girano un po' per lo schermo, poi raggiungono ognuno la cella di un
// blocco e ci si posano con un piccolo rimbalzo, ricomponendo la scritta. Al ritorno
// ripartono in volo verso il bordo laterale più vicino.
// Il volo è lo stesso del robottino singolo (bgFlyer.js): velocità desiderata raggiunta con
// accelerazione limitata (inerzia), tratti ad arco con piccole sbandate, frenata morbida.
// Le posizioni sono in celle della griglia, così scorrono insieme alla griglia.
// (Nel codice si chiamano ancora "bears": prima erano orsacchiotti.)
// Il disegno 3D è in bgArmy3d.js; finché il 3D non è pronto, o senza WebGL, al loro posto
// si disegna l'immagine statica del personaggio.
import { createArmy3D } from './bgArmy3d'
import { fallbackUrl } from './novaModel'
import { createPose } from './novaPose'
import { drawFlames } from './bgFlyer'

const SPEED = 4.2 // celle al secondo
const RETURN_SPEED = 5
const ACCEL = 2.6 // accelerazione massima, in velocità massime al secondo
const STEER = 2.4 // prontezza nel cambiare direzione
const ENTRY_GAP = 0.06 // secondi tra l'ingresso di un robottino e il successivo
const WANDER = [0.6, 1.4] // tappe a caso prima di andare al proprio posto (quasi sempre una)
const EXIT_DELAY = [0, 0.7] // al ritorno non partono tutti nello stesso istante
const LAND = 0.9 // celle dal proprio posto in cui inizia l'atterraggio "a molla"
const SPRING = 55 // rigidezza della molla di atterraggio
const DAMP = 0.42 // smorzamento (sotto 1: un piccolo rimbalzo prima di fermarsi)

const rand = (a, b) => a + Math.random() * (b - a)

let fallbackImg = null
function getFallbackImg() {
  if (!fallbackImg) {
    fallbackImg = new Image()
    fallbackImg.decoding = 'async'
    fallbackImg.src = fallbackUrl
  }
  return fallbackImg.complete && fallbackImg.naturalWidth ? fallbackImg : null
}

export function createArmy() {
  const body = createArmy3D()
  let bears = []
  let lastDraw = 0
  let mode = 'idle' // 'assemble' | 'return' | 'idle'
  let clock = 0
  let bounds = { cols: 20, minRow: 0, maxRow: 10 }

  // targets: [[col, row], ...] celle dei blocchi della scritta
  function start(targets, view) {
    body.ready() // prepara il 3D mentre i blocchi cadono
    getFallbackImg()
    clock = 0
    mode = 'assemble'
    bounds = view
    // i robottini destinati alle lettere di sinistra entrano più spesso da sinistra
    const mid = view.cols / 2
    bears = targets
      .map(([tc, tr]) => ({ tc, tr, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ tc, tr }, i) => {
        const left = Math.random() < (tc < mid ? 0.75 : 0.25)
        const x = left ? -1.5 : view.cols + 0.5
        const y = rand(view.minRow, view.maxRow)
        return {
          x,
          y,
          vx: (left ? 1 : -1) * SPEED * 0.7,
          vy: rand(-0.5, 0.5),
          ax: 0,
          ay: 0,
          target: [tc, tr],
          way: null, // tappa in corso [x, y]
          stops: Math.round(rand(...WANDER)),
          curve: 0,
          phase: 'fly', // fly -> land -> done; al ritorno leave
          enterAt: i * ENTRY_GAP,
          entered: false,
          leaveAt: 0,
          done: false,
          seed: rand(0, 100),
          face: left ? 1 : -1,
          pose: createPose(),
          col: tc,
          row: tr
        }
      })
  }

  // ripartono in volo verso il bordo laterale più vicino
  function goHome() {
    mode = 'return'
    clock = 0
    for (const b of bears) {
      if (!b.entered) {
        b.gone = true
        continue
      }
      // chi è già al suo posto parte con un piccolo ritardo, chi è ancora in volo subito
      b.leaveAt = b.done ? rand(...EXIT_DELAY) : 0
      b.phase = 'leave'
      b.done = false
      const right = b.x > bounds.cols / 2
      b.way = [right ? bounds.cols + 2 : -3, b.y + rand(-2, 2)]
      b.curve = rand(0.2, 0.5) * (Math.random() < 0.5 ? -1 : 1)
    }
  }

  // tappa a caso nello schermo visibile, ad arco
  function pickStop(b) {
    const v = bounds
    b.way = [rand(1, v.cols - 2), rand(v.minRow + 0.5, v.maxRow - 0.5)]
    b.curve = rand(0.25, 0.7) * (Math.random() < 0.5 ? -1 : 1)
  }

  // Un passo di volo verso (tx, ty): velocità desiderata, accelerazione limitata.
  // brake: distanza (in celle) in cui inizia a frenare.
  function fly(b, dt, tx, ty, speed, brake) {
    const dx = tx - b.x
    const dy = ty - b.y
    const dist = Math.hypot(dx, dy) || 1e-6
    const near = Math.min(1, dist / brake)
    const k = Math.max(near * near * (3 - 2 * near), 0.12)
    const t = clock + b.seed
    const wander = 0.22 * Math.sin(t * 0.9) + 0.12 * Math.sin(t * 2.1 + 2) + 0.05 * Math.sin(t * 4.3)
    const ang = b.curve * Math.min(1, dist / 6) + wander * Math.min(1, dist / 3)
    const c = Math.cos(ang)
    const s = Math.sin(ang)
    const ux = dx / dist
    const uy = dy / dist
    const wx = (ux * c - uy * s) * speed * k
    const wy = (ux * s + uy * c) * speed * k
    let ax = (wx - b.vx) * STEER
    let ay = (wy - b.vy) * STEER
    const am = Math.hypot(ax, ay)
    const max = ACCEL * speed
    if (am > max) {
      ax *= max / am
      ay *= max / am
    }
    integrate(b, dt, ax, ay)
    return dist
  }

  function integrate(b, dt, ax, ay) {
    b.vx += ax * dt
    b.vy += ay * dt
    b.x += b.vx * dt
    b.y += b.vy * dt
    const sa = Math.min(1, dt * 8)
    b.ax += (ax - b.ax) * sa
    b.ay += (ay - b.ay) * sa
  }

  function step(b, dt) {
    const [tc, tr] = b.target
    if (b.phase === 'leave') {
      if (clock < b.leaveAt) {
        // ancora al suo posto, un attimo prima di partire
        hold(b, dt, tc, tr)
        return
      }
      const d = fly(b, dt, b.way[0], b.way[1], RETURN_SPEED, 0.5)
      if (b.x < -1.5 || b.x > bounds.cols + 1.5 || d < 0.5) b.gone = true
      return
    }
    if (b.phase === 'done') {
      hold(b, dt, tc, tr)
      return
    }
    if (b.phase === 'land') {
      hold(b, dt, tc, tr)
      if (Math.hypot(b.x - tc, b.y - tr) < 0.03 && Math.hypot(b.vx, b.vy) < 0.15) {
        b.phase = 'done'
        b.done = true
      }
      return
    }
    // in volo: prima qualche tappa a caso, poi verso il proprio posto
    if (!b.way) {
      if (b.stops > 0) pickStop(b)
      else {
        b.way = [tc, tr]
        b.curve = rand(0.15, 0.45) * (Math.random() < 0.5 ? -1 : 1)
      }
    }
    const home = b.stops <= 0
    const d = fly(b, dt, b.way[0], b.way[1], SPEED, home ? 2.2 : 1.4)
    if (home && d < LAND) b.phase = 'land'
    else if (!home && d < 0.8) {
      b.stops--
      b.way = null
    }
  }

  // molla verso la propria cella: arrivo elastico, poi fermo (l'ondeggiamento lo aggiunge il disegno)
  function hold(b, dt, tx, ty) {
    const c = 2 * Math.sqrt(SPRING) * DAMP
    integrate(b, dt, SPRING * (tx - b.x) - c * b.vx, SPRING * (ty - b.y) - c * b.vy)
  }

  function update(dt, view) {
    if (mode === 'idle') return false
    bounds = view
    clock += dt
    for (const b of bears) {
      if (b.gone) continue
      if (!b.entered) {
        if (mode === 'return' || clock < b.enterAt) continue
        b.entered = true
      }
      // a passi piccoli, così inerzia e molla restano stabili
      let left = dt
      while (left > 1e-4) {
        const h = Math.min(left, 1 / 60)
        left -= h
        step(b, h)
      }
    }
    if (mode === 'return' && bears.every((b) => b.gone)) {
      bears = []
      mode = 'idle'
    }
    return mode !== 'idle'
  }

  // angleOf(col, row) -> rotazione della lettera a cui appartiene la cella (null se ferma)
  function draw(ctx, view, angleOf) {
    const dt = Math.min(Math.max(clock - lastDraw, 0), 0.1)
    lastDraw = clock
    const acc = ACCEL * SPEED
    const robots = []
    for (const b of bears) {
      if (b.gone || !b.entered) continue
      let gx = b.x
      let spin = 0
      if (b.done) {
        const s = angleOf(...b.target)
        if (s) {
          // ruota insieme alla sua lettera, attorno all'asse verticale della lettera
          gx = s.axis + (gx + 0.5 - s.axis) * Math.cos(s.angle) - 0.5
          spin = s.angle
        }
      }
      // guarda dalla parte verso cui vola (come il robottino singolo)
      if (Math.abs(b.vx) > SPEED * 0.15) b.face = b.vx > 0 ? 1 : -1
      const vx = b.vx / SPEED
      const vy = b.vy / SPEED
      const ax = b.ax / acc
      const ay = b.ay / acc
      robots.push({
        b,
        x: gx * view.cell + view.cell / 2,
        y: b.y * view.cell - view.gridScroll + view.cell / 2,
        vx,
        vy,
        ax,
        ay,
        face: b.face,
        seed: b.seed,
        pose: b.pose,
        spin,
        // spinta delle fiammelle, come per il robottino singolo
        thrust: Math.min(1, 0.25 * Math.hypot(vx, vy) + 0.75 * Math.min(1, Math.hypot(ax, ay))),
        flip: b.face < 0
      })
    }
    if (!robots.length) {
      body.hide()
      return
    }
    if (body.ready() && body.draw(robots, view, clock, dt)) {
      // ombre e fiammelle sul canvas dello sfondo, sotto i robottini 3D
      for (const r of robots) {
        if (!r.jets) continue
        const moving = Math.min(1, Math.hypot(r.vx, r.vy) * 1.5)
        drawFlames(ctx, { x: r.x, y: r.y, face: r.face, scale: 1 }, view.cell, clock + r.seed, r.thrust, view.light, r.jets, {
          size: 1.35,
          shadow: moving
        })
      }
      return
    }
    // immagine statica solo se il 3D non c'è (senza WebGL) o non è ancora pronto
    body.hide()
    const img = getFallbackImg()
    if (!img) return
    const size = view.cell * 1.25
    for (const r of robots) {
      ctx.save()
      ctx.translate(r.x, r.y + Math.sin(clock * 2.4 + r.seed) * view.cell * 0.04)
      if (r.flip) ctx.scale(-1, 1)
      ctx.drawImage(img, -size / 2, -size / 2, size, size)
      ctx.restore()
    }
  }

  // prepara il 3D in anticipo, nei momenti liberi
  function prepare() {
    body.ready()
  }

  function mount(el) {
    body.mount(el)
  }

  function dispose() {
    body.dispose()
  }

  function clear() {
    bears = []
    mode = 'idle'
    body.hide()
  }

  const assembled = () => mode === 'assemble' && bears.length > 0 && bears.every((b) => b.done)
  const active = () => mode !== 'idle'

  // quota di orsacchiotti già usciti dallo schermo nel ritorno (1 se non ce n'è nessuno)
  const goneRatio = () => (bears.length ? bears.filter((b) => b.gone).length / bears.length : 1)
  return { start, goHome, update, draw, clear, assembled, active, goneRatio, prepare, mount, dispose }
}
