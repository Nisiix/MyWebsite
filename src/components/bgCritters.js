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

// Mascotte originale in 2D: un fagiolino giallo con orecchie tonde, un'antenna con un
// cubetto dorato in cima (come i blocchi del sito), occhi neri, braccine e piedini.
// Guarda dove cammina; ogni tanto apre la bocca come se masticasse.
function drawCritter(ctx, x, y, cell, c, clock, light) {
  const u = cell * 0.36 * c.scale // unità di misura: circa il raggio del corpo
  if (u <= 0) return
  const [dx, dy] = c.dir
  const face = dx < 0 ? -1 : 1 // girato verso sinistra o destra
  const look = dy !== 0 ? 0 : 1 // di fronte quando va su o giù
  const walk = Math.sin(clock * 14 + c.life)
  const hop = Math.abs(walk) * u * 0.12
  const outline = light ? '#6b5200' : '#3a2c00'
  ctx.save()
  ctx.translate(x, y + u * 0.15)
  ctx.lineWidth = Math.max(1, u * 0.07)
  ctx.lineJoin = 'round'
  ctx.strokeStyle = outline

  // ombra
  ctx.fillStyle = light ? 'rgba(60, 50, 20, 0.16)' : 'rgba(0, 0, 0, 0.4)'
  ctx.beginPath()
  ctx.ellipse(0, u * 0.98, u * 0.7, u * 0.16, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.translate(0, -hop)
  ctx.scale(face, 1)

  // piedini che si alternano
  ctx.fillStyle = c.color.dark
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(side * u * 0.32 + walk * side * u * 0.08, u * 0.88, u * 0.2, u * 0.11, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
  }

  // antenna con il cubetto dorato
  ctx.beginPath()
  ctx.moveTo(u * 0.05, -u * 0.95)
  ctx.quadraticCurveTo(u * 0.25, -u * 1.25, u * 0.15, -u * 1.45)
  ctx.stroke()
  ctx.save()
  ctx.translate(u * 0.15, -u * 1.5)
  ctx.rotate(Math.sin(clock * 3) * 0.3)
  ctx.fillStyle = light ? '#b08a1e' : '#d4af37'
  ctx.fillRect(-u * 0.13, -u * 0.13, u * 0.26, u * 0.26)
  ctx.strokeRect(-u * 0.13, -u * 0.13, u * 0.26, u * 0.26)
  ctx.restore()

  // orecchie tonde e corte
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * u * 0.5, -u * 0.78)
    ctx.rotate(side * 0.35)
    ctx.fillStyle = c.color.body
    ctx.beginPath()
    ctx.ellipse(0, 0, u * 0.22, u * 0.26, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = c.color.dark
    ctx.beginPath()
    ctx.ellipse(0, u * 0.03, u * 0.11, u * 0.14, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // braccine che dondolano
  ctx.fillStyle = c.color.body
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * u * 0.78, u * 0.2)
    ctx.rotate(side * (0.5 + walk * 0.35))
    ctx.beginPath()
    ctx.ellipse(0, u * 0.12, u * 0.12, u * 0.24, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // corpo a fagiolino, piatto con una sfumatura leggera
  const grad = ctx.createLinearGradient(0, -u, 0, u)
  grad.addColorStop(0, c.color.body)
  grad.addColorStop(1, c.color.dark)
  ctx.fillStyle = grad
  ctx.beginPath()
  ctx.ellipse(0, 0, u * 0.82, u * 0.95, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  // pancia più chiara
  ctx.fillStyle = 'rgba(255, 248, 214, 0.75)'
  ctx.beginPath()
  ctx.ellipse(u * 0.05 * look, u * 0.42, u * 0.42, u * 0.36, 0, 0, Math.PI * 2)
  ctx.fill()

  // viso spostato verso la direzione di marcia
  const fx = u * 0.18 * look
  const fy = dy * u * 0.08
  for (const side of [-1, 1]) {
    const ex = side * u * 0.28 + fx
    const ey = -u * 0.25 + fy
    ctx.fillStyle = '#121110'
    ctx.beginPath()
    ctx.ellipse(ex, ey, u * 0.11, u * 0.15, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#ffffff'
    ctx.beginPath()
    ctx.arc(ex + u * 0.03, ey - u * 0.06, u * 0.045, 0, Math.PI * 2)
    ctx.fill()
  }
  // bocca: sorriso, che ogni tanto si apre per masticare
  const phase = (clock + c.life * 0.37) % CHEW_EVERY
  const chew = phase < CHEW_FOR ? (1 - Math.cos((phase / CHEW_FOR) * Math.PI * 2 * CHEW_BITES)) / 2 : 0
  const mx = fx
  const my = u * 0.02 + fy
  ctx.lineWidth = Math.max(1, u * 0.06)
  ctx.strokeStyle = '#121110'
  if (chew > 0.08) {
    ctx.fillStyle = '#4a1414'
    ctx.beginPath()
    ctx.ellipse(mx, my + u * 0.04, u * 0.15, u * 0.04 + u * 0.14 * chew, 0, 0, Math.PI * 2)
    ctx.fill()
  } else {
    ctx.beginPath()
    ctx.arc(mx, my - u * 0.04, u * 0.13, 0.2 * Math.PI, 0.8 * Math.PI)
    ctx.stroke()
  }
  ctx.restore()
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
  ctx.fill()
}
