// Orsacchiotto in 2D, originale, usato dall'esercito di "Schiocca le dita" (vedi bgSnap.js).

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
