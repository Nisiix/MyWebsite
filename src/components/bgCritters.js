// Personaggino a sfera che gira nella griglia dello sfondo della home, come in un labirinto.
// Entra da un bordo laterale, si muove da una cella all'altra evitando le celle occupate
// (scritta, blocchi alzati), ogni tanto cambia strada, poi esce dal bordo più vicino.

const COLOR = { body: '#ffd23f', dark: '#c99700' } // giallo
const DIRS = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1]
]
const SPEED = 2.4 // celle al secondo
const TURN_CHANCE = 0.3 // a ogni incrocio, probabilità di cambiare strada anche se si può proseguire
const LIFE = [12, 22] // secondi a spasso prima di dirigersi verso l'uscita
const PAUSE = [6, 14] // secondi tra un'uscita e il rientro successivo
const POP = 0.35 // secondi per sparire se resta bloccato mentre cerca l'uscita
const EXIT_TIMEOUT = 15 // secondi massimi per trovare l'uscita
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

  // Entra da fuori schermo, a sinistra o a destra, su una riga con la prima cella libera
  function spawn(view, isFree) {
    if (critters.length) return
    for (let tries = 0; tries < 40; tries++) {
      const fromLeft = Math.random() < 0.5
      const row = Math.floor(rand(view.minRow, view.maxRow + 1))
      const edge = fromLeft ? 0 : view.cols - 1
      if (!isFree(edge, row) || reserved(edge, row)) continue
      const col = fromLeft ? -1 : view.cols
      const dir = fromLeft ? [1, 0] : [-1, 0]
      critters.push({ col, row, tcol: col, trow: row, t: 1, dir, color: COLOR, age: 0, life: rand(...LIFE), scale: 1, entering: true })
      return
    }
  }

  // Sceglie la prossima cella: dritto se possibile, a volte gira, torna indietro solo se bloccato.
  // Quando è ora di andare, punta al bordo laterale più vicino e può uscire dallo schermo.
  function chooseNext(c, view, isFree, leaving) {
    const ok = ([dx, dy]) => {
      const col = c.col + dx
      const row = c.row + dy
      if (row < view.minRow || row > view.maxRow) return false
      if (col < 0 || col >= view.cols) return leaving && dy === 0
      return isFree(col, row) && !reserved(col, row, c)
    }
    let dir = null
    if (c.entering) {
      // primo passo dentro lo schermo
      if (ok(c.dir)) dir = c.dir
      c.entering = false
    }
    const exitDir = c.col < view.cols / 2 ? [-1, 0] : [1, 0]
    if (!dir && leaving && ok(exitDir)) dir = exitDir
    if (!dir) {
      const back = [-c.dir[0], -c.dir[1]]
      const sides = DIRS.filter((d) => (d[0] !== c.dir[0] || d[1] !== c.dir[1]) && (d[0] !== back[0] || d[1] !== back[1])).filter(ok)
      if (ok(c.dir) && !(sides.length && Math.random() < TURN_CHANCE)) dir = c.dir
      else if (sides.length) dir = sides[Math.floor(Math.random() * sides.length)]
      else if (ok(back)) dir = back
    }
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
    if (!critters.length) nextSpawn -= dt
    if (nextSpawn <= 0) {
      spawn(view, isFree)
      nextSpawn = rand(...PAUSE)
    }
    for (const c of critters) {
      c.age += dt
      const leaving = c.age > c.life
      // non trova l'uscita: sparisce sul posto
      if (c.age > c.life + EXIT_TIMEOUT) c.scale = Math.max(0, c.scale - dt / POP)
      if (c.t < 1) {
        c.t = Math.min(1, c.t + SPEED * dt)
        if (c.t === 1) {
          c.col = c.tcol
          c.row = c.trow
          if (leaving && (c.col < 0 || c.col >= view.cols)) c.gone = true
        }
      }
      if (c.t >= 1 && !c.gone && c.scale > 0) chooseNext(c, view, isFree, leaving)
    }
    // via quelli usciti, spariti o finiti fuori dallo schermo scorrendo
    critters = critters.filter((c) => !c.gone && c.scale > 0 && c.row >= view.minRow - 1 && c.row <= view.maxRow + 1)
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
  const r = cell * 0.36 * c.scale
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
