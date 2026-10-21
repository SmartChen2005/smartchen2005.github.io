// CSS owns the three palettes. Native scrolling only changes their mixture.
export function paletteAt(palettes, progress) {
  const position = Math.max(0, Math.min(1, progress)) * 2;
  const index = Math.min(1, Math.floor(position));
  const fraction = position - index;
  const blend = fraction * fraction * (3 - 2 * fraction);
  return palettes[index].map((color, tone) => color.map((channel, component) =>
    Math.round(channel + (palettes[index + 1][tone][component] - channel) * blend)));
}

export function startCathedralLight(win, doc) {
  const body = doc.querySelector('.cathedral-light-page');
  if (!body) return () => {};
  const style = win.getComputedStyle(body);
  const tones = ['a', 'b', 'c'];
  const palettes = ['amber', 'mist', 'rose'].map(name => tones.map(tone =>
    style.getPropertyValue(`--cathedral-${name}-${tone}`).trim().split(/\s+/).map(Number)));
  if (palettes.flat().some(color => color.length !== 3 || !color.every(Number.isFinite))) return () => {};
  const reduced = win.matchMedia('(prefers-reduced-motion: reduce)');
  const forced = win.matchMedia('(forced-colors: active)');
  const disabled = () => reduced.matches || forced.matches;
  const progress = () => Math.max(0, Math.min(1, win.scrollY / Math.max(1, doc.documentElement.scrollHeight - win.innerHeight)));
  let current = 0, target = 0, frame = 0, previousTime = 0, lastPaint = '';
  const paint = value => {
    const colors = paletteAt(palettes, value).map(color => color.join(' '));
    const key = colors.join('/');
    if (key === lastPaint) return;
    lastPaint = key;
    tones.forEach((tone, index) => body.style.setProperty(`--light-${tone}`, colors[index]));
  };
  const stop = () => {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0; previousTime = 0;
  };
  const tick = time => {
    frame = 0;
    if (doc.hidden || disabled()) { stop(); return; }
    const elapsed = previousTime ? Math.max(0, time - previousTime) : 16;
    previousTime = time;
    current += (target - current) * (1 - Math.exp(-elapsed / 160));
    if (Math.abs(target - current) < .0007) current = target;
    paint(current);
    if (current !== target) frame = win.requestAnimationFrame(tick);
    else previousTime = 0;
  };
  const scroll = () => {
    if (doc.hidden || disabled()) return;
    target = progress();
    if (!frame && current !== target) frame = win.requestAnimationFrame(tick);
  };
  const refresh = () => {
    stop();
    if (doc.hidden) return;
    current = target = disabled() ? 0 : progress();
    paint(current);
  };
  const visibility = () => doc.hidden ? stop() : refresh();
  win.addEventListener('scroll', scroll, {passive: true});
  win.addEventListener('resize', refresh);
  win.addEventListener('pageshow', refresh);
  win.addEventListener('pagehide', stop);
  doc.addEventListener('visibilitychange', visibility);
  reduced.addEventListener('change', refresh);
  forced.addEventListener('change', refresh);
  const observer = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(refresh) : null;
  observer?.observe(body);
  refresh();
  return () => {
    stop(); observer?.disconnect();
    win.removeEventListener('scroll', scroll);
    win.removeEventListener('resize', refresh);
    win.removeEventListener('pageshow', refresh);
    win.removeEventListener('pagehide', stop);
    doc.removeEventListener('visibilitychange', visibility);
    reduced.removeEventListener('change', refresh);
    forced.removeEventListener('change', refresh);
    tones.forEach(tone => body.style.removeProperty(`--light-${tone}`));
  };
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') startCathedralLight(window, document);
