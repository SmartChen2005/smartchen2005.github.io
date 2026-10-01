const clamp = value => Math.max(-1, Math.min(1, value));
const difference = (value, origin) => ((value - origin + 540) % 360) - 180;

// Relative orientation, never heading/location. All samples stay in memory.
export function createCardOrientation({ change, allowed, canRequest = allowed }) {
  const coarse = matchMedia('(any-pointer: coarse)');
  const api = window.DeviceOrientationEvent;
  const supported = window.isSecureContext === true && !!api && coarse.matches;
  let permission = supported ? typeof api.requestPermission === 'function' ? 'prompt' : 'granted' : 'unavailable';
  let wanted = false, attached = false, pending = false, receiving = false;
  let neutral = null, filtered = null, calibratedAt = 0, previousAt = 0, timeout = 0;

  const screenAngle = () => window.screen?.orientation?.angle ?? window.orientation ?? 0;
  function reset() {
    clearTimeout(timeout); timeout = 0;
    neutral = filtered = null; receiving = false;
    change({ x: 0, y: 0 });
  }
  function orientation(event) {
    if (!attached || !allowed() || !Number.isFinite(event.beta) || !Number.isFinite(event.gamma)) return;
    const now = performance.now(), angle = screenAngle();
    if (!neutral || neutral.angle !== angle) {
      neutral = { beta: event.beta, gamma: event.gamma, angle };
      filtered = { x: 0, y: 0 }; calibratedAt = previousAt = now;
      change({ x: 0, y: 0 });
    }
    receiving = true;
    clearTimeout(timeout); timeout = setTimeout(reset, 1400);
    // Establish the holding position before responding; damp raw sensor noise.
    if (now - calibratedAt < 180) {
      neutral.beta += difference(event.beta, neutral.beta) * .15;
      neutral.gamma += difference(event.gamma, neutral.gamma) * .15;
      previousAt = now; return;
    }
    const beta = difference(event.beta, neutral.beta), gamma = difference(event.gamma, neutral.gamma);
    const radians = angle * Math.PI / 180;
    const x = gamma * Math.cos(radians) + beta * Math.sin(radians);
    const y = beta * Math.cos(radians) - gamma * Math.sin(radians);
    const deadband = v => Math.sign(v) * Math.max(0, Math.abs(v) - .55);
    const next = { x: clamp(deadband(x) / 16), y: clamp(deadband(y) / 18) };
    const ease = 1 - Math.exp(-Math.min(80, Math.max(1, now - previousAt)) / 55);
    previousAt = now;
    filtered.x += (next.x - filtered.x) * ease;
    filtered.y += (next.y - filtered.y) * ease;
    change({ ...filtered });
  }
  function sync() {
    const active = wanted && supported && coarse.matches && permission === 'granted' && allowed();
    if (active === attached) return;
    attached = active;
    if (active) window.addEventListener('deviceorientation', orientation, { passive: true });
    else { window.removeEventListener('deviceorientation', orientation); reset(); }
  }
  async function activate() {
    if (!supported || !canRequest() || permission !== 'prompt' || pending) return;
    pending = true;
    try {
      // Called synchronously from a relevant click/tap, never from show()/load.
      permission = await api.requestPermission() === 'granted' ? 'granted' : 'denied';
    } catch { permission = 'denied'; }
    pending = false; sync();
  }
  window.addEventListener('orientationchange', reset);
  window.screen?.orientation?.addEventListener('change', reset);
  coarse.addEventListener('change', sync);
  return { activate, setActive(value) { wanted = value; sync(); },
    get receiving() { return receiving; }, get permission() { return permission; } };
}
