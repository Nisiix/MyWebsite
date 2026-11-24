// Robottino corazzato che vola nello sfondo della home.
// Entra da un bordo laterale, vola liberamente nello schermo visibile da un punto all'altro
// girando intorno alla scritta, poi esce dal bordo più vicino. Mentre si sposta, da mani e
// piedi escono fiammelle bianco-celeste.
// Il personaggio è il modello 3D Nova Ward, disegnato da bgFlyer3d.js; qui ci sono il volo,
// l'ombra e le fiammelle.

import { createFlyer3D } from './bgFlyer3d'

const SPEED = 2.6 // celle al secondo
const STEER = 2.6 // prontezza nel cambiare direzione (più alto = curve più strette)
const LIFE = [12, 22] // secondi in volo prima di dirigersi verso l'uscita
const PAUSE = [6, 14] // secondi tra un'uscita e il rientro successivo
const HOVER = [0.3, 1.4] // secondi fermo a mezz'aria a ogni tappa
const EXIT_TIMEOUT = 15 // secondi massimi per uscire, poi sparisce sul posto
const NAV = 80 // px della barra di navigazione in alto

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
    f = { x, y, vx: fromLeft ? 1 : -1, vy: 0, tx: x, ty: y, hover: 0, age: 0, life: rand(...LIFE), scale: 1, face: fromLeft ? 1 : -1 }
    pickTarget(view)
  }

  // prossima tappa: un punto libero dello schermo raggiungibile senza passare sulla scritta
  function pickTarget(view) {
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

    const speed = SPEED * view.cell
    const dx = f.tx - f.x
    const dy = f.ty - f.y
    const dist = Math.hypot(dx, dy)
    let wx = 0
    let wy = 0
    if (f.hover > 0) {
      f.hover -= dt
      if (f.hover <= 0) pickTarget(view)
    } else if (dist < view.cell * 0.35) {
      if (f.exiting) {
        // arrivato al bordo: se è già fuori ha finito, altrimenti prosegue verso l'esterno
        if (f.x < -view.cell || f.x > view.width + view.cell) f.gone = true
        else pickExit(view)
      } else f.hover = rand(...HOVER)
    } else {
      // rallenta avvicinandosi alla tappa
      const k = Math.min(1, dist / (view.cell * 1.5))
      wx = (dx / dist) * speed * Math.max(k, 0.35)
      wy = (dy / dist) * speed * Math.max(k, 0.35)
    }
    // tiene le distanze dalla scritta
    const r = view.avoid
    if (r && !f.exiting) {
      const m = view.cell * 0.9
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
    const a = Math.min(1, STEER * dt)
    f.vx += (wx - f.vx) * a
    f.vy += (wy - f.vy) * a
    f.x += f.vx * dt
    f.y += f.vy * dt
    // resta nello schermo visibile (tranne quando entra o esce dai lati)
    f.y = Math.min(Math.max(f.y, NAV + view.cell * 0.5), view.height - view.cell * 0.5)
    if (Math.abs(f.vx) > speed * 0.15) f.face = f.vx > 0 ? 1 : -1
    if (f.gone || f.scale <= 0) f = null
    return true
  }

  let lastDt = 0

  function draw(ctx, view) {
    if (!f || f.scale <= 0) {
      body.hide()
      return
    }
    const thrust = Math.min(1, Math.hypot(f.vx, f.vy) / (SPEED * view.cell))
    const bob = Math.sin(clock * 3.2) * view.cell * 0.03
    const points = body.draw(f, f.x, f.y + bob, view.cell, clock, thrust, view.light, lastDt, true)
    drawFlames(ctx, f, view.cell, clock, thrust, view.light, points)
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
function drawFlames(ctx, f, cell, clock, thrust, light, points) {
  const u = cell * 0.5 * f.scale
  if (u <= 0) return
  // ombra staccata: sta volando
  ctx.save()
  ctx.fillStyle = light ? 'rgba(60, 30, 30, 0.13)' : 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(f.x, f.y + cell * 1.15, u * 0.7, u * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
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
