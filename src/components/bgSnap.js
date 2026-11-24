// "Schiocca le dita": un robottino Nova Ward per ogni blocco della scritta. Entrano dai bordi
// laterali, girano un po' a caso nella griglia, poi raggiungono ognuno la cella di un blocco
// e ricompongono la scritta. Al ritorno rifanno all'indietro esattamente la strada fatta.
// (Nel codice si chiamano ancora "bears": prima erano orsacchiotti.)
// Il disegno 3D è in bgArmy3d.js; finché il 3D non è pronto, o senza WebGL, al loro posto
// si disegna l'immagine statica del personaggio.
import { createArmy3D } from './bgArmy3d'
import { fallbackUrl } from './novaModel'
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
]
const SPEED = 3.6 // celle al secondo
const RETURN_SPEED = 4.2
const ENTRY_GAP = 0.07 // secondi tra l'ingresso di un orsacchiotto e il successivo
const WANDER = [1.2, 3] // secondi a zonzo prima di andare al proprio posto

const rand = (a, b) => a + Math.random() * (b - a)
const randInt = (a, b) => Math.floor(rand(a, b + 1))

// verso in cui guarda il robottino per ogni direzione di marcia (0 = verso chi legge)
const YAW = { '1,0': 1.15, '-1,0': -1.15, '0,1': 0, '0,-1': Math.PI }

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

  const occupied = (col, row, self) =>
    bears.some((b) => b !== self && b.entered && ((b.col === col && b.row === row) || (b.tcol === col && b.trow === row)))

  // targets: [[col, row], ...] celle dei blocchi della scritta
  function start(targets, view) {
    body.ready() // prepara il 3D mentre i blocchi cadono
    getFallbackImg()
    clock = 0
    mode = 'assemble'
    // gli orsacchiotti destinati alle lettere di sinistra entrano più spesso da sinistra
    const mid = view.cols / 2
    bears = targets
      .map(([tc, tr]) => ({ tc, tr, order: Math.random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ tc, tr }, i) => {
        const left = Math.random() < (tc < mid ? 0.75 : 0.25)
        const col = left ? -1 : view.cols
        const row = randInt(view.minRow, view.maxRow)
        return {
          col, row, tcol: col, trow: row, t: 1,
          dir: [left ? 1 : -1, 0],
          target: [tc, tr],
          path: [[col, row]],
          enterAt: i * ENTRY_GAP,
          entered: false,
          wander: rand(...WANDER),
          age: 0,
          route: null,
          done: false,
          idle: false,
          life: rand(0, 50),
          seed: rand(0, 100),
          yaw: left ? YAW['1,0'] : YAW['-1,0']
        }
      })
  }

  // tornano ai bordi rifacendo all'indietro la strada percorsa
  function goHome() {
    mode = 'return'
    for (const b of bears) {
      if (!b.entered) {
        b.gone = true
        continue
      }
      // se è a metà di un passo, lo ripercorre all'indietro
      if (b.t < 1) {
        const from = [b.col, b.row]
        b.col = b.tcol
        b.row = b.trow
        b.tcol = from[0]
        b.trow = from[1]
        b.t = 1 - b.t
        b.dir = [Math.sign(b.tcol - b.col), Math.sign(b.trow - b.row)]
      }
      // l'ultima cella del percorso è quella dove si trova (o verso cui sta tornando)
      b.route = b.path.slice(0, -1).reverse()
      b.idle = false
      b.done = false
    }
  }

  function bfs(b, view, isFree) {
    const [tc, tr] = b.target
    const minR = Math.min(view.minRow, tr, b.row)
    const maxR = Math.max(view.maxRow, tr, b.row)
    const key = (c, r) => c + ':' + r
    const prev = new Map([[key(b.col, b.row), null]])
    const queue = [[b.col, b.row]]
    while (queue.length) {
      const [c, r] = queue.shift()
      if (c === tc && r === tr) {
        const route = []
        let k = key(c, r)
        let cur = [c, r]
        while (prev.get(k)) {
          route.unshift(cur)
          cur = prev.get(k)
          k = key(cur[0], cur[1])
        }
        return route
      }
      for (const [dx, dy] of DIRS) {
        const nc = c + dx
        const nr = r + dy
        if (nc < 0 || nc >= view.cols || nr < minR || nr > maxR) continue
        const k = key(nc, nr)
        if (prev.has(k)) continue
        if (!(nc === tc && nr === tr) && !isFree(nc, nr)) continue
        prev.set(k, [c, r])
        queue.push([nc, nr])
      }
    }
    // nessuna strada libera: in linea retta, prima in orizzontale poi in verticale
    const route = []
    let c = b.col
    let r = b.row
    while (c !== tc) route.push([(c += Math.sign(tc - c)), r])
    while (r !== tr) route.push([c, (r += Math.sign(tr - r))])
    return route
  }

  function stepTo(b, col, row) {
    b.dir = [Math.sign(col - b.col), Math.sign(row - b.row)]
    b.tcol = col
    b.trow = row
    b.t = 0
  }

  function wanderStep(b, view, isFree) {
    const ok = ([dx, dy]) => {
      const c = b.col + dx
      const r = b.row + dy
      return c >= 0 && c < view.cols && r >= view.minRow && r <= view.maxRow && isFree(c, r) && !occupied(c, r, b)
    }
    const back = [-b.dir[0], -b.dir[1]]
    const sides = DIRS.filter((d) => (d[0] !== b.dir[0] || d[1] !== b.dir[1]) && (d[0] !== back[0] || d[1] !== back[1])).filter(ok)
    let dir = null
    if (ok(b.dir) && !(sides.length && Math.random() < 0.3)) dir = b.dir
    else if (sides.length) dir = sides[Math.floor(Math.random() * sides.length)]
    else if (ok(back)) dir = back
    if (dir) stepTo(b, b.col + dir[0], b.row + dir[1])
  }

  function update(dt, view, isFree) {
    if (mode === 'idle') return false
    clock += dt
    const speed = mode === 'return' ? RETURN_SPEED : SPEED
    for (const b of bears) {
      if (b.gone) continue
      if (!b.entered) {
        if (clock < b.enterAt) continue
        b.entered = true
      }
      b.age += dt
      if (b.t < 1) {
        b.t = Math.min(1, b.t + speed * dt)
        if (b.t === 1) {
          b.col = b.tcol
          b.row = b.trow
          if (mode === 'assemble') b.path.push([b.col, b.row])
        }
      }
      if (b.t < 1) continue
      if (mode === 'return') {
        const next = b.route.shift()
        if (next) stepTo(b, next[0], next[1])
        else b.gone = true
        continue
      }
      if (b.done) continue
      const [tc, tr] = b.target
      if (b.col === tc && b.row === tr && b.route) {
        b.done = true
        b.idle = true
        b.dir = [0, 1] // al suo posto guarda verso chi legge
        continue
      }
      if (b.col < 0 || b.col >= view.cols) {
        stepTo(b, b.col + b.dir[0], b.row) // primo passo dentro lo schermo
      } else if (b.age < b.wander) {
        wanderStep(b, view, isFree)
      } else {
        if (!b.route) b.route = bfs(b, view, isFree)
        const next = b.route.shift()
        if (next) stepTo(b, next[0], next[1])
        else b.route.push([tc, tr]) // sicurezza: non dovrebbe succedere
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
    const robots = []
    for (const b of bears) {
      if (b.gone || !b.entered) continue
      let gx = b.col + (b.tcol - b.col) * b.t
      const gy = b.row + (b.trow - b.row) * b.t
      let target = YAW[b.dir.join(',')] ?? 0
      if (b.done) {
        const spin = angleOf(b.col, b.row)
        if (spin) {
          // ruota insieme alla sua lettera, attorno all'asse verticale della lettera
          gx = spin.axis + (gx + 0.5 - spin.axis) * Math.cos(spin.angle) - 0.5
          target += spin.angle
          b.yaw = target
        }
      }
      // si gira con morbidezza, dalla parte più corta
      let d = target - b.yaw
      d = Math.atan2(Math.sin(d), Math.cos(d))
      b.yaw += d * Math.min(1, dt * 10)
      const moving = b.t < 1 ? 1 : 0
      b.move = (b.move ?? 0) + (moving - (b.move ?? 0)) * Math.min(1, dt * 8)
      robots.push({
        x: gx * view.cell + view.cell / 2,
        y: gy * view.cell - view.gridScroll + view.cell / 2,
        yaw: b.yaw,
        lean: [b.dir[0] * b.move, b.dir[1] * b.move],
        moving: b.move,
        seed: b.seed,
        flip: b.dir[0] < 0
      })
    }
    if (!robots.length) return
    if (body.ready() && body.draw(ctx, robots, view.cell, clock)) return
    // immagine statica finché le viste 3D non sono pronte
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

  // prepara le viste 3D in anticipo, nei momenti liberi
  function prepare() {
    body.ready()
  }

  function dispose() {
    body.dispose()
  }

  function clear() {
    bears = []
    mode = 'idle'
  }

  const assembled = () => mode === 'assemble' && bears.length > 0 && bears.every((b) => b.done)
  const active = () => mode !== 'idle'

  // quota di orsacchiotti già usciti dallo schermo nel ritorno (1 se non ce n'è nessuno)
  const goneRatio = () => (bears.length ? bears.filter((b) => b.gone).length / bears.length : 1)
  return { start, goHome, update, draw, clear, assembled, active, goneRatio, prepare, dispose }
}
