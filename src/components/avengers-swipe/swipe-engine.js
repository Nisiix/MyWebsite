/** Single-direction swipe controller. No click handler; commits only on release or keyboard confirmation. */
export function mountSwipe(root, options = {}) {
  const track = root.querySelector('.av-track');
  const mode = options.side ?? root.dataset.mode;
  if (mode !== 'thanos' && mode !== 'ironman') throw new Error('Invalid swipe side');
  const handle = root.querySelector('.av-handle.' + mode);
  if (!track || !handle) throw new Error('Missing swipe elements');
  const handles = { [mode]: handle };
  root.dataset.mode = mode;
  const live = root.querySelector('.av-live');
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  let threshold = Number.isFinite(options.threshold) ? clamp(options.threshold, .5, 1) : .82;
  let disabled = !!options.disabled, phase = 'idle', side = '', progress = 0, pointer = null, origin = 0, travel = 1, timer = 0;
  const dist = (s) => Math.max(1, track.clientWidth - handles[s].offsetWidth - 2 * handles[s].offsetTop);
  const paint = () => {
    root.dataset.side = side || 'none'; root.dataset.phase = phase; root.dataset.disabled = String(disabled);
    root.style.setProperty('--p', String(progress));
    root.style.setProperty('--offset', `${(side === 'ironman' ? -1 : 1) * progress * travel}px`);
    root.dataset.ready = String(phase === 'drag' && progress >= threshold);
    for (const h of Object.values(handles)) h.disabled = disabled;
  };
  const reset = () => {
    clearTimeout(timer); const old = pointer; const handle = handles[side]; pointer = null; phase = 'idle'; side = ''; progress = 0; live.textContent = ''; paint();
    if (old !== null && handle?.hasPointerCapture(old)) handle.releasePointerCapture(old);
  };
  const begin = (s) => { side = s; travel = dist(s); progress = 0; phase = 'drag'; paint(); };
  const commit = () => {
    const completedSide = side; phase = 'success'; progress = 1; pointer = null; paint();
    live.textContent = options.doneText || (completedSide === 'thanos' ? 'Infinity Protocol attivato' : 'Arc Protocol attivato');
    timer = setTimeout(() => { reset(); options.onComplete?.(completedSide); }, 1050);
    options.onCommit?.(completedSide);
  };
  const cleanups = [];
  const listen = (el, event, fn) => { el.addEventListener(event, fn); cleanups.push(() => el.removeEventListener(event, fn)); };
  for (const s of Object.keys(handles)) {
    const h = handles[s];
    const update = (e) => { progress = clamp((e.clientX - origin) * (s === 'thanos' ? 1 : -1) / travel, 0, 1); paint(); };
    listen(h, 'pointerdown', (e) => {
      if (disabled || phase !== 'idle' || !e.isPrimary || e.button !== 0) return;
      begin(s); pointer = e.pointerId; origin = e.clientX;
      try { h.setPointerCapture(pointer); } catch { reset(); }
    });
    listen(h, 'pointermove', (e) => { if (pointer === e.pointerId && side === s && phase === 'drag') update(e); });
    listen(h, 'pointerup', (e) => {
      if (pointer !== e.pointerId || side !== s || phase !== 'drag') return;
      update(e); pointer = null;
      if (progress >= threshold && !disabled) commit(); else reset();
    });
    for (const name of ['pointercancel', 'lostpointercapture']) listen(h, name, (e) => { if (pointer === e.pointerId) reset(); });
    listen(h, 'keydown', (e) => {
      if (disabled || phase === 'success' || pointer !== null) return;
      const forward = s === 'thanos' ? 'ArrowRight' : 'ArrowLeft';
      const backward = s === 'thanos' ? 'ArrowLeft' : 'ArrowRight';
      if (![forward, backward, 'Enter', 'Escape'].includes(e.key)) return;
      e.preventDefault();
      if (e.key === 'Escape') { reset(); return; }
      if (e.key === 'Enter') { if (side === s && progress >= threshold) commit(); return; }
      if (side !== s || phase === 'idle') { if (e.key !== forward) return; begin(s); }
      progress = clamp(progress + (e.key === forward ? .25 : -.25), 0, 1); paint();
      live.textContent = progress >= threshold ? (options.readyText?.() || 'Premi Invio per confermare') : (options.chargeText?.(Math.round(progress * 100)) || `Carica ${Math.round(progress * 100)} percento`);
    });
    listen(h, 'blur', () => { if (phase === 'drag' && pointer === null && side === s) reset(); });
  }
  const resize = () => { if (side) { if (pointer !== null) reset(); else { travel = dist(side); paint(); } } };
  const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : null;
  observer?.observe(track); paint();
  return {
    setDisabled(value) { disabled = !!value; if (disabled && phase === 'drag') reset(); else paint(); },
    setThreshold(value) { if (Number.isFinite(value)) threshold = clamp(value, .5, 1); paint(); },
    reset,
    destroy() { reset(); observer?.disconnect(); cleanups.forEach(fn => fn()); }
  };
}
