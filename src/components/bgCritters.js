// Orsacchiotto che gira nella griglia dello sfondo della home, come in un labirinto.
// Entra da un bordo laterale, si muove da una cella all'altra evitando le celle occupate
// (scritta, blocchi alzati), ogni tanto cambia strada, poi esce dal bordo più vicino.

const COLOR = { body: '#ffd23f', dark: '#c99700', light: '#ffe066', outline: ['#6b5200', '#3a2c00'] } // giallo
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

// Orsacchiotto giallo in 2D, originale: testa tonda con orecchie tonde, muso chiaro con
// nasino nero, pancia chiara, braccine e piedini con i cuscinetti. Guarda dove cammina
// e ogni tanto apre la bocca come se masticasse.
export function drawCritter(ctx, x, y, cell, c, clock, light) {
  const u = cell * 0.36 * c.scale // unità di misura: circa il raggio della testa
  if (u <= 0) return
  const [dx, dy] = c.dir
  const face = dx < 0 ? -1 : 1 // girato verso sinistra o destra
  const look = dy !== 0 ? 0 : 1 // di fronte quando va su o giù
  const walk = c.idle ? 0 : Math.sin(clock * 14 + c.life)
  const hop = Math.abs(walk) * u * 0.1
  const outline = (c.color.outline || ['#6b5200', '#3a2c00'])[light ? 0 : 1]
  const cream = '#fff3c4'
  const ink = '#1a1408'
  const ellipse = (ex, ey, rx, ry, fill, stroke = true) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.ellipse(ex, ey, rx, ry, 0, 0, Math.PI * 2)
    ctx.fill()
    if (stroke) ctx.stroke()
  }
  ctx.save()
  ctx.translate(x, y + u * 0.1)
  ctx.lineWidth = Math.max(1, u * 0.07)
  ctx.strokeStyle = outline

  // ombra
  ctx.fillStyle = light ? 'rgba(60, 50, 20, 0.16)' : 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.ellipse(0, u * 1.02, u * 0.75, u * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.translate(0, -hop)
  // c.turn (coseno dell'angolo) schiaccia il disegno quando ruota con la sua lettera
  ctx.scale(face * (c.turn ?? 1), 1)

  // piedini con il cuscinetto chiaro
  for (const side of [-1, 1]) {
    const fx = side * u * 0.36 + walk * side * u * 0.07
    ellipse(fx, u * 0.9, u * 0.24, u * 0.15, c.color.dark)
    ellipse(fx + u * 0.04, u * 0.9, u * 0.11, u * 0.07, cream, false)
  }
  // corpo
  const grad = ctx.createLinearGradient(0, 0, 0, u)
  grad.addColorStop(0, c.color.body)
  grad.addColorStop(1, c.color.dark)
  ellipse(0, u * 0.5, u * 0.68, u * 0.5, grad)
  ellipse(u * 0.05 * look, u * 0.56, u * 0.36, u * 0.3, cream, false)
  // braccine che dondolano
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * u * 0.6, u * 0.38)
    ctx.rotate(side * (0.45 + walk * 0.35))
    ellipse(0, u * 0.14, u * 0.14, u * 0.26, c.color.body)
    ctx.restore()
  }
  // orecchie tonde con l'interno chiaro
  for (const side of [-1, 1]) {
    ellipse(side * u * 0.58, -u * 0.62, u * 0.26, u * 0.26, c.color.body)
    ellipse(side * u * 0.58, -u * 0.6, u * 0.13, u * 0.13, cream, false)
  }
  // testa
  const headGrad = ctx.createLinearGradient(0, -u, 0, u * 0.3)
  headGrad.addColorStop(0, c.color.light || '#ffe066')
  headGrad.addColorStop(1, c.color.body)
  ellipse(0, -u * 0.12, u * 0.78, u * 0.66, headGrad)

  // viso spostato verso la direzione di marcia
  const fx = u * 0.16 * look
  const fy = dy * u * 0.06
  // occhi
  for (const side of [-1, 1]) {
    const ex = side * u * 0.3 + fx
    const ey = -u * 0.24 + fy
    ellipse(ex, ey, u * 0.09, u * 0.11, ink, false)
    ellipse(ex + u * 0.025, ey - u * 0.04, u * 0.03, u * 0.03, '#ffffff', false)
  }
  // muso chiaro con nasino
  const mx = fx * 1.3
  const my = u * 0.08 + fy
  ctx.lineWidth = Math.max(1, u * 0.05)
  ellipse(mx, my, u * 0.3, u * 0.22, cream)
  ellipse(mx, my - u * 0.07, u * 0.09, u * 0.065, ink, false)
  // bocca: sorriso, che ogni tanto si apre per masticare
  const phase = (clock + c.life * 0.37) % CHEW_EVERY
  const chew = phase < CHEW_FOR ? (1 - Math.cos((phase / CHEW_FOR) * Math.PI * 2 * CHEW_BITES)) / 2 : 0
  ctx.strokeStyle = ink
  ctx.lineWidth = Math.max(1, u * 0.045)
  ctx.beginPath()
  ctx.moveTo(mx, my - u * 0.01)
  ctx.lineTo(mx, my + u * 0.05)
  ctx.stroke()
  if (chew > 0.08) {
    ellipse(mx, my + u * 0.1, u * 0.09, u * 0.02 + u * 0.07 * chew, '#7a2a1e', false)
  } else {
    ctx.beginPath()
    ctx.arc(mx - u * 0.06, my + u * 0.05, u * 0.06, 0, Math.PI * 0.9)
    ctx.arc(mx + u * 0.06, my + u * 0.05, u * 0.06, Math.PI * 0.1, Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}
