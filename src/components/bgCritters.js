// Personaggini a sfera che girano nella griglia dello sfondo della home, come in un labirinto.
// Si muovono da una cella all'altra, evitano celle occupate (scritta, blocchi alzati, altri
// personaggini), ogni tanto cambiano strada, compaiono e spariscono a caso e non troppo spesso.

const COLORS = [
  { name: 'red', body: '#ff3b47', dark: '#b3121d' },
  { name: 'green', body: '#2fd665', dark: '#11893a' },
  { name: 'blue', body: '#3d86ff', dark: '#1745b8' }
]
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
]
const SPEED = 2.4 // celle al secondo
const TURN_CHANCE = 0.3 // a ogni incrocio, probabilità di cambiare strada anche se si può proseguire
const LIFE = [12, 22] // secondi di vita di un personaggino
const PAUSE = [6, 14] // secondi tra un'apparizione e la successiva
const POP = 0.35 // secondi per comparire o sparire
const CHEW_EVERY = 5 // secondi tra una masticata e l'altra
const CHEW_FOR = 1.6 // durata di una masticata
const CHEW_BITES = 3 // morsi in una masticata

const rand = (a, b) => a + Math.random() * (b - a)

export function createCritters() {
  let critters = []
  let nextSpawn = rand(2, 4) // il primo arriva poco dopo l'ingresso nella home
  let clock = 0

  const reserved = (col, row, self) =>
    critters.some((c) => c !== self && ((c.col === col && c.row === row) || (c.tcol === col && c.trow === row)))

  function spawn(view, isFree) {
    const color = COLORS.find((k) => !critters.some((c) => c.color === k))
    if (!color) return
    // una cella libera a caso tra quelle visibili
    for (let tries = 0; tries < 40; tries++) {
      const col = Math.floor(rand(0, view.cols))
      const row = Math.floor(rand(view.minRow, view.maxRow + 1))
      if (!isFree(col, row) || reserved(col, row)) continue
      const dir = DIRS[Math.floor(Math.random() * 4)]
      critters.push({ col, row, tcol: col, trow: row, t: 1, dir, color, age: 0, life: rand(...LIFE), scale: 0 })
      return
    }
  }

  // Sceglie la prossima cella: dritto se possibile, a volte gira, torna indietro solo se bloccato
  function chooseNext(c, view, isFree) {
    const ok = ([dx, dy]) => {
      const col = c.col + dx
      const row = c.row + dy
      return col >= 0 && col < view.cols && row >= view.minRow && row <= view.maxRow && isFree(col, row) && !reserved(col, row, c)
    }
    const back = [-c.dir[0], -c.dir[1]]
    const sides = DIRS.filter((d) => (d[0] !== c.dir[0] || d[1] !== c.dir[1]) && (d[0] !== back[0] || d[1] !== back[1])).filter(ok)
    let dir = null
    if (ok(c.dir) && !(sides.length && Math.random() < TURN_CHANCE)) dir = c.dir
    else if (sides.length) dir = sides[Math.floor(Math.random() * sides.length)]
    else if (ok(back)) dir = back
    if (!dir) return false // circondato: aspetta un giro
    c.dir = dir
    c.tcol = c.col + dir[0]
    c.trow = c.row + dir[1]
    c.t = 0
    return true
  }

  function update(dt, view, isFree) {
    if (!view.active) {
      critters = []
      return false
    }
    clock += dt
    nextSpawn -= dt
    if (nextSpawn <= 0) {
      spawn(view, isFree)
      nextSpawn = rand(...PAUSE)
    }
    for (const c of critters) {
      c.age += dt
      const leaving = c.age > c.life
      c.scale = leaving ? Math.max(0, c.scale - dt / POP) : Math.min(1, c.scale + dt / POP)
      if (c.t < 1) {
        c.t = Math.min(1, c.t + SPEED * dt)
        if (c.t === 1) {
          c.col = c.tcol
          c.row = c.trow
        }
      }
      if (c.t >= 1 && !leaving) chooseNext(c, view, isFree)
    }
    // via quelli spariti o finiti fuori dallo schermo scorrendo
    critters = critters.filter((c) => !(c.age > c.life && c.scale === 0) && c.row >= view.minRow - 1 && c.row <= view.maxRow + 1)
    return critters.length > 0
  }

  function draw(ctx, view) {
    for (const c of critters) {
      if (c.scale <= 0) continue
      const gx = c.col + (c.tcol - c.col) * c.t
      const gy = c.row + (c.trow - c.row) * c.t
      const x = gx * view.cell + view.cell / 2
      const y = gy * view.cell - view.gridScroll + view.cell / 2
      drawCritter(ctx, x, y, view.cell, c, clock, view.light)
    }
  }

  function reset() {
    critters = []
    nextSpawn = rand(2, 4)
  }

  return { update, draw, reset }
}

// Personaggino originale: una sferetta lucida con due occhi neri e una bocca disegnata
// sul viso che si apre e si chiude come se masticasse; il viso guarda dove va
function drawCritter(ctx, x, y, cell, c, clock, light) {
  const r = cell * 0.36 * easeBack(c.scale)
  if (r <= 0) return
  const hop = Math.abs(Math.sin(clock * 8 + c.life)) * cell * 0.05
  const [dx, dy] = c.dir
  ctx.save()
  ctx.translate(x, y)

  // ombra sul pavimento
  ctx.fillStyle = light ? 'rgba(60, 50, 20, 0.16)' : 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.ellipse(0, r * 0.95, r * 0.75, r * 0.2, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.translate(0, -hop)
  // sfera con volume: luce in alto a sinistra
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r)
  grad.addColorStop(0, '#ffffff')
  grad.addColorStop(0.12, c.color.body)
  grad.addColorStop(0.55, c.color.body)
  grad.addColorStop(1, c.color.dark)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.fill()

  // il viso si sposta verso la direzione di marcia
  const fx = dx * r * 0.28
  const fy = dy * r * 0.22
  // occhi neri con un puntino di luce
  for (const side of [-1, 1]) {
    const ex = side * r * 0.3 + fx
    const ey = -r * 0.2 + fy
    ctx.fillStyle = '#0d0c0a'
    ctx.beginPath()
    ctx.ellipse(ex, ey, r * 0.12, r * 0.16, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.beginPath()
    ctx.arc(ex - r * 0.04, ey - r * 0.06, r * 0.04, 0, Math.PI * 2)
    ctx.fill()
  }
  // bocca: ogni tanto mastica (qualche morso lento), poi resta chiusa per un po'
  const phase = (clock + c.life * 0.37) % CHEW_EVERY
  const chew = phase < CHEW_FOR ? (1 - Math.cos((phase / CHEW_FOR) * Math.PI * 2 * CHEW_BITES)) / 2 : 0
  const mw = r * 0.42
  const mh = r * (0.05 + 0.3 * chew)
  const mx = fx
  const my = r * 0.3 + fy
  ctx.fillStyle = '#2a0d0d'
  ctx.beginPath()
  ctx.ellipse(mx, my, mw / 2, mh / 2 + r * 0.02, 0, 0, Math.PI * 2)
  ctx.fill()
  // lingua quando la bocca è aperta
  if (chew > 0.35) {
    ctx.fillStyle = 'rgba(240, 110, 120, 0.9)'
    ctx.beginPath()
    ctx.ellipse(mx, my + mh * 0.22, mw * 0.28, mh * 0.22, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}

// piccolo rimbalzo quando compare
function easeBack(t) {
  const k = 1.70158
  return 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2)
}
