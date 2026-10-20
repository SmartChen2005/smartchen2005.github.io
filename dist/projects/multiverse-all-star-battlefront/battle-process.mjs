import content from './process-data.mjs';

const root = document.querySelector('[data-battle-process]');
if (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const buttons = [...root.querySelectorAll('[data-process-button]')];
  const stops = [...root.querySelectorAll('[data-process-stop]')];
  const scenes = [...root.querySelectorAll('[data-process-scene]')];
  const currentLabel = root.querySelector('.process-current');
  const sceneLabel = root.querySelector('[data-scene-label]');
  const prompt = root.querySelector('[data-typed-prompt]');
  const stats = [...root.querySelectorAll('[data-stat-value]')];
  const playerHealth = root.querySelector('[data-player-health]');
  const opponentHealth = root.querySelector('[data-opponent-health]');
  const turnLabel = root.querySelector('[data-turn-label]');
  const turnCaption = root.querySelector('[data-turn-caption]');
  const clamp = value => Math.max(0, Math.min(1, value));
  const range = (value, from, to) => clamp((value - from) / (to - from));
  const ease = value => value * value * (3 - 2 * value);
  const targets = [.14, .43, .81, 1];
  let stage = -1, frame = 0, dirty = true, lastTime = 0, manualY = null;
  let target = 0, displayed = 0, lastTurn = -1, lastCount = -1;

  function select(index, manual = false) {
    if (manual) { manualY = scrollY; target = targets[index]; schedule(); }
    if (stage === index) return;
    stage = index;
    root.dataset.stage = String(index);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-active', i === index);
      scene.setAttribute('aria-hidden', String(i !== index));
      scene.inert = i !== index;
    });
    currentLabel.setAttribute('aria-live', manual ? 'polite' : 'off');
    currentLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${content.steps[index].title}`;
    sceneLabel.textContent = `${String(index + 1).padStart(2, '0')} — ${content.steps[index].title}`;
  }
  function sync() {
    if (reduced.matches || forced.matches) return;
    if (manualY !== null && Math.abs(scrollY - manualY) < 2) return;
    manualY = null;
    const bounds = root.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const line = innerHeight * (innerWidth <= 760 ? .75 : .55);
    const centers = stops.map(stop => { const r = stop.getBoundingClientRect(); return r.top + r.height / 2; });
    target = clamp((line - centers[0]) / (centers.at(-1) - centers[0]));
    select(centers.reduce((best, value, i) => Math.abs(value - line) < Math.abs(centers[best] - line) ? i : best, 0));
  }
  function paint(value) {
    root.style.setProperty('--process-progress', value.toFixed(4));
    const typed = Math.max(12, Math.round(content.example.prompt.length * range(value, 0, .14)));
    if (typed !== lastCount) { prompt.textContent = content.example.prompt.slice(0, typed); lastCount = typed; }
    const generated = ease(range(value, .17, .43));
    root.style.setProperty('--generated', generated.toFixed(4));
    stats.forEach(stat => { stat.textContent = String(Math.round(Number(stat.dataset.statValue) * generated)); });
    const battle = range(value, .50, .81);
    const turn = Math.min(content.example.turns.length - 1, Math.floor(battle * content.example.turns.length));
    const local = battle * content.example.turns.length - turn;
    root.style.setProperty('--advance', `${Math.sin(clamp(local) * Math.PI) * 28}px`);
    root.style.setProperty('--impact', Math.sin(clamp(local) * Math.PI).toFixed(4));
    const from = content.example.turns[Math.max(0, turn - 1)];
    const to = content.example.turns[turn];
    const amount = ease(clamp(local));
    const playerHP = from.playerHP + (to.playerHP - from.playerHP) * amount;
    const opponentHP = from.opponentHP + (to.opponentHP - from.opponentHP) * amount;
    playerHealth.style.transform = `scaleX(${playerHP / 100})`;
    opponentHealth.style.transform = `scaleX(${opponentHP / 100})`;
    playerHealth.parentElement.setAttribute('aria-valuenow', String(Math.round(playerHP)));
    opponentHealth.parentElement.setAttribute('aria-valuenow', String(Math.round(opponentHP)));
    root.dataset.turn = String(turn);
    if (turn !== lastTurn) {
      turnLabel.textContent = `${String(turn + 1).padStart(2, '0')} / ${to.title}`;
      turnCaption.textContent = to.caption;
      lastTurn = turn;
    }
    root.style.setProperty('--result-reveal', ease(range(value, .84, 1)).toFixed(4));
  }
  function tick(time) {
    frame = 0;
    const dt = lastTime ? Math.min(48, time - lastTime) : 16;
    lastTime = time;
    if (dirty) { dirty = false; sync(); }
    displayed = reduced.matches || forced.matches ? target : displayed + (target - displayed) * (1 - Math.exp(-dt / 160));
    if (Math.abs(target - displayed) < .0002) displayed = target;
    paint(displayed);
    if (displayed !== target && !document.hidden) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function schedule() {
    dirty = true;
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  buttons.forEach((button, index) => {
    button.disabled = false;
    button.addEventListener('click', () => select(index, true));
    button.addEventListener('keydown', event => {
      if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? buttons.length - 1
        : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next].scrollIntoView({ block: 'center', behavior: 'instant' });
      buttons[next].focus({ preventScroll: true });
      select(next, true);
    });
  });
  root.classList.add('is-enhanced');
  select(0);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', schedule);
  addEventListener('pageshow', schedule);
  reduced.addEventListener('change', schedule);
  forced.addEventListener('change', schedule);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; lastTime = 0; }
    else schedule();
  });
  document.fonts.ready.then(schedule);
  schedule();
}
