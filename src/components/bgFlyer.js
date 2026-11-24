// Robottino corazzato che vola nello sfondo della home.
// Entra da un bordo laterale, vola liberamente nello schermo visibile da un punto all'altro
// girando intorno alla scritta, poi esce dal bordo più vicino. Mentre si sposta, da mani e
// piedi escono fiammelle bianco-celeste.

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

export function createFlyer() {
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
    if (!view.active) {
      f = null
      return false
    }
    clock += dt
    if (!f) {
      nextSpawn -= dt
      if (nextSpawn <= 0) {
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

  function draw(ctx, view) {
    if (!f || f.scale <= 0) return
    const thrust = Math.min(1, Math.hypot(f.vx, f.vy) / (SPEED * view.cell))
    drawFlyer(ctx, f.x, f.y, view.cell, f, clock, thrust, view.light)
  }

  function reset() {
    f = null
    nextSpawn = rand(2, 4)
  }

  return { update, draw, reset }
}

const RED = '#d8283f'
const RED_DARK = '#8c1426'
const RED_LIGHT = '#ff6272'
const METAL = '#2c313d'
const CYAN = '#63e6ff'

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

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

// Robottino originale: casco rosso chiuso con una fascia-visore celeste, corazza rossa con
// giunture scure, nucleo celeste sul petto e un anello di energia che gli orbita intorno.
export function drawFlyer(ctx, x, y, cell, f, clock, thrust, light) {
  const u = cell * 0.34 * f.scale
  if (u <= 0) return
  const face = f.face
  const bob = Math.sin(clock * 3.2) * u * 0.08
  const tilt = Math.max(-0.35, Math.min(0.35, (f.vx / (cell * SPEED)) * 0.35))
  const outline = light ? '#5a0d18' : '#1a0509'
  const fl = (p) => 0.75 + 0.25 * Math.sin(clock * 38 + p) + Math.random() * 0.12
  // le fiamme spingono all'indietro e verso il basso
  const back = -face * thrust * 0.6
  const power = 0.45 + thrust * 0.75

  // ombra sul pavimento, staccata: sta volando
  ctx.save()
  ctx.fillStyle = light ? 'rgba(60, 30, 30, 0.13)' : 'rgba(0, 0, 0, 0.35)'
  ctx.beginPath()
  ctx.ellipse(x, y + u * 2.05, u * 0.7, u * 0.14, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(x, y + bob)
  ctx.rotate(tilt)
  ctx.lineWidth = Math.max(1, u * 0.07)
  ctx.strokeStyle = outline
  ctx.lineJoin = 'round'

  const orbitA = clock * 2.4
  const orbit = (front) => {
    // anello di energia inclinato; la metà dietro va disegnata prima del corpo
    ctx.save()
    ctx.rotate(-0.35)
    ctx.strokeStyle = 'rgba(99, 230, 255, 0.75)'
    ctx.lineWidth = Math.max(1, u * 0.06)
    ctx.shadowColor = CYAN
    ctx.shadowBlur = u * 0.5
    ctx.beginPath()
    ctx.ellipse(0, u * 0.05, u * 1.35, u * 0.42, 0, front ? 0 : Math.PI, front ? Math.PI : Math.PI * 2)
    ctx.stroke()
    const s = Math.sin(orbitA)
    if (s >= 0 === front) {
      ctx.fillStyle = '#e8fbff'
      ctx.beginPath()
      ctx.arc(Math.cos(orbitA) * u * 1.35, u * 0.05 + s * u * 0.42, u * 0.12, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.restore()
  }
  orbit(false)

  // fiamme da piedi e mani
  flame(ctx, -u * 0.28, u * 1.32, back, 1, u * 1.1 * power, u * 0.17, fl(0))
  flame(ctx, u * 0.28, u * 1.32, back, 1, u * 1.1 * power, u * 0.17, fl(2))
  flame(ctx, -u * 0.92, u * 0.62, back - 0.2, 1, u * 0.7 * power, u * 0.12, fl(4))
  flame(ctx, u * 0.92, u * 0.62, back + 0.2, 1, u * 0.7 * power, u * 0.12, fl(6))

  // gambe
  for (const side of [-1, 1]) {
    ctx.fillStyle = RED_DARK
    roundRect(ctx, side * u * 0.28 - u * 0.17, u * 0.6, u * 0.34, u * 0.72, u * 0.12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = METAL
    roundRect(ctx, side * u * 0.28 - u * 0.2, u * 1.12, u * 0.4, u * 0.2, u * 0.08)
    ctx.fill()
    ctx.stroke()
  }

  // braccia leggermente aperte, mani verso il basso
  for (const side of [-1, 1]) {
    ctx.save()
    ctx.translate(side * u * 0.62, -u * 0.05)
    ctx.rotate(side * -0.35)
    ctx.fillStyle = RED
    roundRect(ctx, -u * 0.14, 0, u * 0.28, u * 0.6, u * 0.12)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = METAL
    ctx.beginPath()
    ctx.arc(0, u * 0.66, u * 0.15, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // busto
  const bodyG = ctx.createLinearGradient(-u * 0.6, -u * 0.2, u * 0.6, u * 0.8)
  bodyG.addColorStop(0, RED_LIGHT)
  bodyG.addColorStop(0.5, RED)
  bodyG.addColorStop(1, RED_DARK)
  ctx.fillStyle = bodyG
  roundRect(ctx, -u * 0.55, -u * 0.25, u * 1.1, u * 0.95, u * 0.3)
  ctx.fill()
  ctx.stroke()
  // cintura scura
  ctx.fillStyle = METAL
  roundRect(ctx, -u * 0.5, u * 0.5, u * 1.0, u * 0.16, u * 0.06)
  ctx.fill()
  // nucleo di energia sul petto (tondo, pulsante)
  const pulse = 0.85 + 0.15 * Math.sin(clock * 5)
  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = u * 0.6 * pulse
  ctx.fillStyle = '#e9fcff'
  ctx.beginPath()
  ctx.arc(0, u * 0.15, u * 0.15 * pulse, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  ctx.strokeStyle = CYAN
  ctx.lineWidth = Math.max(1, u * 0.05)
  ctx.beginPath()
  ctx.arc(0, u * 0.15, u * 0.22, 0, Math.PI * 2)
  ctx.stroke()
  ctx.strokeStyle = outline
  ctx.lineWidth = Math.max(1, u * 0.07)

  // casco chiuso: cupola rossa con fascia-visore celeste rivolta dove vola
  const headG = ctx.createRadialGradient(-u * 0.2, -u * 0.95, u * 0.1, 0, -u * 0.65, u * 0.7)
  headG.addColorStop(0, RED_LIGHT)
  headG.addColorStop(1, RED)
  ctx.fillStyle = headG
  roundRect(ctx, -u * 0.5, -u * 1.2, u * 1.0, u * 0.98, u * 0.42)
  ctx.fill()
  ctx.stroke()
  ctx.save()
  ctx.shadowColor = CYAN
  ctx.shadowBlur = u * 0.5
  ctx.fillStyle = CYAN
  roundRect(ctx, -u * 0.36 + face * u * 0.06, -u * 0.82, u * 0.72, u * 0.17, u * 0.08)
  ctx.fill()
  ctx.restore()
  // riflesso sul casco
  ctx.fillStyle = 'rgba(255, 255, 255, 0.35)'
  ctx.beginPath()
  ctx.ellipse(-u * 0.2, -u * 1.02, u * 0.16, u * 0.07, -0.4, 0, Math.PI * 2)
  ctx.fill()

  orbit(true)
  ctx.restore()
}
