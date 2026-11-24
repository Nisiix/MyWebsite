// Robottino corazzato che vola nello sfondo della home.
// Entra da un bordo laterale, vola liberamente nello schermo visibile da un punto all'altro
// girando intorno alla scritta, poi esce dal bordo più vicino. Ogni tanto, a caso, invece di
// girarci intorno sorvola la scritta: prende quota prima dei blocchi (si alza sullo schermo,
// sembra un po' più vicino, l'ombra resta a terra e si fa più tenue) e riscende dopo. Mentre si sposta, da mani e
// piedi escono fiammelle bianco-celeste.
// Il personaggio è il modello 3D Nova Ward, disegnato da bgFlyer3d.js; qui ci sono il volo,
// l'ombra e le fiammelle.

import { createFlyer3D } from './bgFlyer3d'

const SPEED = 2.6 // celle al secondo
const STEER = 2.2 // prontezza nel cambiare direzione (più alto = curve più strette)
const ACCEL = 2.4 // accelerazione massima, in velocità massime al secondo: dà inerzia al volo
const LIFE = [12, 22] // secondi in volo prima di dirigersi verso l'uscita
const PAUSE = [6, 14] // secondi tra un'uscita e il rientro successivo
const HOVER = [0.6, 2.2] // secondi fermo a mezz'aria a ogni tappa
const EXIT_TIMEOUT = 15 // secondi massimi per uscire, poi sparisce sul posto
const NAV = 80 // px della barra di navigazione in alto
const OVER_CHANCE = 0.4 // probabilità che un tratto sorvoli la scritta invece di girarci intorno
const CLIMB = 0.85 // quota sopra la scritta, in celle (spostamento verso l'alto sullo schermo)
const CLIMB_FROM = 2.4 // celle dalla scritta a cui inizia a salire
const CLIMB_ZOOM = 0.14 // in quota sembra un po' più vicino

const rand = (a, b) => a + Math.random() * (b - a)

// il segmento a-b attraversa il rettangolo r (allargato di m)?
function crosses(ax, ay, bx, by, r, m) {
  if (!r) return false
  const x0 = r.x0 - m
  const x1 = r.x1 + m
  const y0 = r.y0 - m
  const y1 = r.y1 + m
  for (let i = 0; i <= 16; i++) {
    const t = i / 16
    const x = ax + (bx - ax) * t
    const y = ay + (by - ay) * t
    if (x > x0 && x < x1 && y > y0 && y < y1) return true
  }
  return false
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export function createFlyer() {
  const body = createFlyer3D()
  let f = null
  let nextSpawn = rand(2, 4) // il primo arriva poco dopo l'ingresso nella home
  let clock = 0

  function spawn(view) {
    const fromLeft = Math.random() < 0.5
    const m = view.cell
    const y = rand(NAV + m, view.height - m)
    const x = fromLeft ? -m : view.width + m
    f = {
      x,
      y,
      vx: (fromLeft ? 1 : -1) * SPEED * m * 0.6,
      vy: 0,
      ax: 0,
      ay: 0,
      tx: x,
      ty: y,
      hx: x,
      hy: y,
      hover: 0,
      curve: 0,
      seed: rand(0, 100),
      age: 0,
      life: rand(...LIFE),
      scale: 1,
      face: fromLeft ? 1 : -1,
      over: false, // il tratto in corso sorvola la scritta
      alt: 0, // quota da 0 (normale) a 1 (sopra i blocchi), con la sua velocità
      altV: 0
    }
    pickTarget(view)
  }

  // prossima tappa: un punto libero dello schermo raggiungibile senza passare sulla scritta
  // (o, ogni tanto, passandoci sopra)
  function pickTarget(view) {
    f.over = false
    if (view.avoid && Math.random() < OVER_CHANCE && pickOver(view)) return
    const m = view.cell * 0.8
    let best = null
    for (let i = 0; i < 40; i++) {
      const tx = rand(m, view.width - m)
      const ty = rand(NAV + m, view.height - m)
      const r = view.avoid
      if (r && tx > r.x0 - m && tx < r.x1 + m && ty > r.y0 - m && ty < r.y1 + m) continue
      best = [tx, ty]
      // tappe non troppo vicine, così attraversa lo schermo
      if (Math.hypot(tx - f.x, ty - f.y) > view.width * 0.25 && !crosses(f.x, f.y, tx, ty, r, m * 0.5)) break
    }
    if (best) [f.tx, f.ty] = best
    // ogni tratto è un arco, piegato da una parte o dall'altra
    f.curve = rand(0.25, 0.7) * (Math.random() < 0.5 ? -1 : 1)
  }

  // tappa dall'altra parte della scritta: il tratto la sorvola. La tappa resta ben lontana dai
  // blocchi, così dopo averli passati riscende.
  function pickOver(view) {
    const r = view.avoid
    const m = view.cell * 1.6
    for (let i = 0; i < 40; i++) {
      const tx = rand(view.cell * 0.8, view.width - view.cell * 0.8)
      const ty = rand(NAV + view.cell * 0.8, view.height - view.cell * 0.8)
      if (tx > r.x0 - m && tx < r.x1 + m && ty > r.y0 - m && ty < r.y1 + m) continue
      if (Math.hypot(tx - f.x, ty - f.y) < view.width * 0.3) continue
      if (!crosses(f.x, f.y, tx, ty, r, -view.cell * 0.5)) continue
      f.tx = tx
      f.ty = ty
      f.over = true
      // arco più dolce: deve passare davvero sopra i blocchi
      f.curve = rand(0.08, 0.3) * (Math.random() < 0.5 ? -1 : 1)
      return true
    }
    return false
  }

  // uscita: verso il bordo laterale più vicino, sopra o sotto la scritta se è in mezzo
  function pickExit(view) {
    const m = view.cell
    const tx = f.x < view.width / 2 ? -m * 1.5 : view.width + m * 1.5
    let ty = f.y
    const r = view.avoid
    if (crosses(f.x, f.y, tx, ty, r, m * 0.4)) {
      ty = f.y < (r.y0 + r.y1) / 2 ? Math.max(NAV + m, r.y0 - m) : Math.min(view.height - m, r.y1 + m)
      if (crosses(f.x, f.y, f.x, ty, r, 0)) ty = r.y1 + m
    }
    f.tx = tx
    f.ty = ty
    f.curve = 0
    f.exiting = true
  }

  function update(dt, view) {
    // con "riduci movimento" attivo il robottino non vola
    if (!view.active || reducedMotion()) {
      f = null
      body.hide()
      return false
    }
    clock += dt
    lastDt = dt
    if (!f) {
      body.hide()
      nextSpawn -= dt
      // parte solo quando il modello 3D (o l'immagine di riserva) è pronto
      if (nextSpawn <= 0 && body.ready()) {
        spawn(view)
        nextSpawn = rand(...PAUSE)
      }
      return !!f
    }
    f.age += dt
    if (f.age > f.life && !f.exiting) pickExit(view)
    if (f.age > f.life + EXIT_TIMEOUT) f.scale = Math.max(0, f.scale - dt / 0.35)

    // a passi piccoli, così l'inerzia resta stabile anche dopo una pausa lunga
    let left = dt
    while (left > 0) {
      const h = Math.min(left, 1 / 60)
      left -= h
      step(h, view)
    }
    // resta nello schermo visibile (tranne quando entra o esce dai lati)
    f.y = Math.min(Math.max(f.y, NAV + view.cell * 0.5), view.height - view.cell * 0.5)
    if (Math.abs(f.vx) > SPEED * view.cell * 0.15) f.face = f.vx > 0 ? 1 : -1
    if (f.gone || f.scale <= 0) f = null
    return true
  }

  let lastDt = 0

  // Un passo di volo: si calcola la velocità desiderata e ci si arriva con accelerazione
  // limitata, così parte, frena e curva con un po' di inerzia.
  function step(dt, view) {
    const cell = view.cell
    const speed = SPEED * cell
    const dx = f.tx - f.x
    const dy = f.ty - f.y
    const dist = Math.hypot(dx, dy)
    const t = clock + f.seed
    let wx = 0
    let wy = 0
    let steer = STEER
    if (f.hover > 0) {
      // sospeso a mezz'aria: ondeggia piano intorno al punto, mai fermo del tutto
      f.hover -= dt
      const px = f.hx + Math.sin(t * 0.9) * cell * 0.22 + Math.sin(t * 2.3) * cell * 0.05
      const py = f.hy + Math.sin(t * 1.4 + 1) * cell * 0.16 + Math.sin(t * 3.1) * cell * 0.04
      wx = (px - f.x) * 2.5
      wy = (py - f.y) * 2.5
      steer = 3
      if (f.hover <= 0) pickTarget(view)
    } else if (dist < cell * 0.5) {
      if (f.exiting) {
        // arrivato al bordo: se è già fuori ha finito, altrimenti prosegue verso l'esterno
        if (f.x < -cell || f.x > view.width + cell) f.gone = true
        else pickExit(view)
      } else {
        f.hover = rand(...HOVER)
        f.hx = f.x
        f.hy = f.y
        f.over = false // sorvolo finito: mentre è sospeso riscende alla quota normale
      }
    } else {
      // frena dolcemente in arrivo (curva a S), parte con slancio
      const near = Math.min(1, dist / (cell * 2.6))
      const k = Math.max(near * near * (3 - 2 * near), 0.18)
      // direzione piegata ad arco, più qualche sbandata lenta e irregolare
      const wander = 0.22 * Math.sin(t * 0.83) + 0.12 * Math.sin(t * 1.97 + 2) + 0.06 * Math.sin(t * 4.1)
      const ang = f.curve * Math.min(1, dist / (cell * 5)) + wander * (f.exiting ? 0.4 : 1)
      const c = Math.cos(ang)
      const s = Math.sin(ang)
      const ux = dx / dist
      const uy = dy / dist
      wx = (ux * c - uy * s) * speed * k
      wy = (ux * s + uy * c) * speed * k
    }
    // tiene le distanze dalla scritta (tranne quando la sorvola)
    const r = view.avoid
    if (r && !f.exiting && !f.over) {
      const m = cell * 0.9
      const nx = Math.min(Math.max(f.x, r.x0), r.x1)
      const ny = Math.min(Math.max(f.y, r.y0), r.y1)
      const ex = f.x - nx
      const ey = f.y - ny
      const d = Math.hypot(ex, ey)
      if (d < m) {
        const push = ((m - d) / m) * speed * 1.6
        if (d > 0.01) {
          wx += (ex / d) * push
          wy += (ey / d) * push
        } else wy += f.y < (r.y0 + r.y1) / 2 ? -push : push
      }
    }
    let ax = (wx - f.vx) * steer
    let ay = (wy - f.vy) * steer
    const am = Math.hypot(ax, ay)
    const max = ACCEL * speed
    if (am > max) {
      ax *= max / am
      ay *= max / am
    }
    f.vx += ax * dt
    f.vy += ay * dt
    f.x += f.vx * dt
    f.y += f.vy * dt
    // accelerazione addolcita, usata per la posa del corpo e le fiammelle
    const sa = Math.min(1, dt * 8)
    f.ax += (ax - f.ax) * sa
    f.ay += (ay - f.ay) * sa

    // quota: sale con anticipo avvicinandosi alla scritta e riscende dopo averla passata,
    // con una molla smorzata (niente scatti, un leggero assestamento)
    // (anche uscendo, se la strada passa sulla scritta; negli altri tratti solo se ci finisce
    // sopra per sbaglio, così girandoci intorno resta alla sua quota)
    let want = 0
    if (r) {
      const nx = Math.min(Math.max(f.x, r.x0), r.x1)
      const ny = Math.min(Math.max(f.y, r.y0), r.y1)
      const from = f.over || f.exiting ? CLIMB_FROM : 0.5
      const near = Math.max(0, 1 - Math.hypot(f.x - nx, f.y - ny) / (cell * from))
      want = near * near * (3 - 2 * near)
    }
    const k = 7
    f.altV += (k * (want - f.alt) - 2 * Math.sqrt(k) * 0.9 * f.altV) * dt
    f.alt += f.altV * dt
  }

  function draw(ctx, view) {
    if (!f || f.scale <= 0) {
      body.hide()
      return
    }
    const sp = SPEED * view.cell
    const alt = Math.max(0, f.alt)
    // velocità di salita sullo schermo (negativa salendo): la posa la sente come un movimento
    // verso l'alto, quindi spinge con i palmi verso il basso
    f.lv = -f.altV * CLIMB * view.cell
    // spinta: un po' per restare in aria, di più quando accelera e quando prende quota
    const thrust = Math.min(
      1,
      0.25 * Math.hypot(f.vx, f.vy) / sp + 0.75 * Math.hypot(f.ax, f.ay) / (ACCEL * sp) + 0.5 * Math.max(0, f.altV) + 0.1 * alt
    )
    const bob = (Math.sin(clock * 2.1 + f.seed) + 0.4 * Math.sin(clock * 3.7)) * view.cell * 0.02
    const lift = alt * CLIMB * view.cell
    const points = body.draw(f, f.x, f.y + bob - lift, view.cell, clock, thrust, view.light, lastDt, true, 1 + CLIMB_ZOOM * alt)
    // l'ombra resta a terra sotto il percorso: più in alto vola, più è larga e tenue
    drawFlames(ctx, f, view.cell, clock, thrust, view.light, points, { shadow: 1 - 0.6 * alt, spread: 1 + 0.5 * alt })
  }

  function reset() {
    f = null
    nextSpawn = rand(2, 4)
    body.hide()
  }

  return { update, draw, reset, mount: body.mount, dispose: body.dispose }
}

// Fiammella che esce da (x, y) nella direzione (dx, dy): nucleo bianco, bordo celeste
function flame(ctx, x, y, dx, dy, len, w, flicker) {
  const l = len * flicker
  if (l <= 0.5) return
  const ang = Math.atan2(dy, dx)
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(ang)
  const g = ctx.createLinearGradient(0, 0, l, 0)
  g.addColorStop(0, 'rgba(255, 255, 255, 0.95)')
  g.addColorStop(0.3, 'rgba(205, 245, 255, 0.85)')
  g.addColorStop(0.7, 'rgba(110, 215, 255, 0.45)')
  g.addColorStop(1, 'rgba(80, 200, 255, 0)')
  ctx.fillStyle = g
  ctx.shadowColor = 'rgba(120, 220, 255, 0.9)'
  ctx.shadowBlur = w * 2
  ctx.beginPath()
  ctx.moveTo(0, -w)
  ctx.quadraticCurveTo(l * 0.45, -w * 1.1, l, 0)
  ctx.quadraticCurveTo(l * 0.45, w * 1.1, 0, w)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// Ombra sul pavimento e fiammelle da piedi e mani. Le fiammelle partono dai punti del
// modello 3D proiettati sullo schermo; senza modello 3D (immagine di riserva) solo l'ombra.
// size: altezza in celle, shadow: intensità dell'ombra da 0 a 1, spread: allargamento
// dell'ombra (più il robottino è alto, più è larga).
export function drawFlames(ctx, f, cell, clock, thrust, light, points, { size = 1.5, shadow = 1, spread = 1 } = {}) {
  const u = cell * (size / 3) * f.scale
  if (u <= 0) return
  // ombra staccata: sta volando
  if (shadow > 0.02) {
    ctx.save()
    ctx.globalAlpha = shadow
    ctx.fillStyle = light ? 'rgba(60, 30, 30, 0.13)' : 'rgba(0, 0, 0, 0.35)'
    ctx.beginPath()
    ctx.ellipse(f.x, f.y + cell * size * 0.77, u * 0.7 * spread, u * 0.14 * spread, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
  if (!points) return

  const fl = (p) => 0.75 + 0.25 * Math.sin(clock * 38 + p) + Math.random() * 0.12
  // le fiamme spingono all'indietro e verso il basso
  const back = -f.face * thrust * 0.6
  const power = (0.45 + thrust * 0.75) * f.scale
  const jets = [
    ['Sole_L', 0, 1.0, 0.16, 0],
    ['Sole_R', 0, 1.0, 0.16, 2],
    ['Palm_emitter_L', -0.2, 0.6, 0.1, 4],
    ['Palm_emitter_R', 0.2, 0.6, 0.1, 6]
  ]
  for (const [key, side, len, w, phase] of jets) {
    const p = points[key]
    if (p) flame(ctx, p[0], p[1], back + side, 1, u * len * power, u * w, fl(phase))
  }
}
