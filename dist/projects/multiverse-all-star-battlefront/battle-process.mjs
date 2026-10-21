import content from './process-data.mjs?v=process-3';

const root = document.querySelector('[data-battle-process]');
if (root) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const forced = matchMedia('(forced-colors: active)');
  const buttons = [...root.querySelectorAll('[data-process-button]')];
  const beatButtons = [...root.querySelectorAll('[data-beat-button]')];
  const stops = [...root.querySelectorAll('[data-process-stop]')];
  const beats = [...root.querySelectorAll('[data-battle-beat]')];
  const scenes = [...root.querySelectorAll('[data-process-scene]')];
  const currentLabel = root.querySelector('.process-current');
  const sceneLabel = root.querySelector('[data-scene-label]');
  const prompt = root.querySelector('[data-typed-prompt]');
  const stats = [...root.querySelectorAll('[data-stat-value]')];
  const playerHealth = root.querySelector('[data-player-health]');
  const opponentHealth = root.querySelector('[data-opponent-health]');
  const turnLabel = root.querySelector('[data-turn-label]');
  const turnCaption = root.querySelector('[data-turn-caption]');
  const sound = root.querySelector('[data-battle-sound]');
  const playerDamage = root.querySelector('[data-player-damage]');
  const opponentDamage = root.querySelector('[data-opponent-damage]');
  const marks = [...root.querySelectorAll('.comic-page-marks span')];
  const clamp = value => Math.max(0, Math.min(1, value));
  const range = (value, from, to) => clamp((value - from) / (to - from));
  const ease = value => value * value * (3 - 2 * value);
  const turns = content.example.turns;
  const beatTargets = turns.map((_, i) => .38 + (i + 1) * .48 / turns.length);
  const targets = [.16, .38, beatTargets[0], 1];
  const anchors = [stops[0], stops[1], ...beats, stops[3]];
  const values = [.16, .38, ...beatTargets, 1];
  let stage = -1, frame = 0, dirty = true, lastTime = 0, manualY = null;
  let target = 0, displayed = 0, lastTurn = -1, lastCount = -1;

  function select(index, manual = false, progress = targets[index]) {
    if (manual) { manualY = scrollY; target = progress; schedule(); }
    currentLabel.setAttribute('aria-live', manual ? 'polite' : 'off');
    if (stage === index) return;
    stage = index;
    root.dataset.stage = String(index);
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    scenes.forEach((scene, i) => {
      scene.classList.toggle('is-active', i === index);
      scene.setAttribute('aria-hidden', String(i !== index));
      scene.inert = i !== index;
    });
    currentLabel.textContent = `${String(index + 1).padStart(2, '0')} / ${content.steps[index].title}`;
    sceneLabel.textContent = `${String(index + 1).padStart(2, '0')} — ${content.steps[index].title}`;
  }
  function sync() {
    if (reduced.matches || forced.matches) return;
    if (manualY !== null && Math.abs(scrollY - manualY) < 2) return;
    manualY = null;
    const bounds = root.getBoundingClientRect();
    if (bounds.bottom < 0 || bounds.top > innerHeight) return;
    const line = innerHeight * (innerWidth <= 760 ? .78 : .55);
    const centers = anchors.map(node => { const r = node.getBoundingClientRect(); return r.top + r.height / 2; });
    if (line < centers[0]) target = .16 * range(line, centers[0] - 300, centers[0]);
    else if (line >= centers.at(-1)) target = 1;
    else {
      const i = centers.findIndex((center, j) => j < centers.length - 1 && line >= center && line < centers[j + 1]);
      target = values[i] + (values[i + 1] - values[i]) * range(line, centers[i], centers[i + 1]);
    }
    const describeEnd = (centers[0] + centers[1]) / 2;
    const generateEnd = (centers[1] + centers[2]) / 2;
    const battleEnd = (centers.at(-2) + centers.at(-1)) / 2;
    select(line < describeEnd ? 0 : line < generateEnd ? 1 : line < battleEnd ? 2 : 3);
  }
  function paint(value) {
    root.style.setProperty('--process-progress', value.toFixed(4));
    const typed = Math.max(12, Math.round(content.example.prompt.length * range(value, 0, .16)));
    if (typed !== lastCount) { prompt.textContent = content.example.prompt.slice(0, typed); lastCount = typed; }
    const generated = ease(range(value, .20, .38));
    root.style.setProperty('--generated', generated.toFixed(4));
    stats.forEach(stat => { stat.textContent = String(Math.round(Number(stat.dataset.statValue) * generated)); });
    const position = range(value, .38, .86) * turns.length;
    // Small hold at each completed exchange avoids subpixel wheel jitter at its anchor.
    const turn = Math.min(turns.length - 1, Math.max(0, Math.ceil(position - .025) - 1));
    const local = clamp(position - turn);
    const quiet = reduced.matches || forced.matches;
    const motion = quiet ? 0 : Math.sin(local * Math.PI);
    const impact = quiet ? 0 : Math.sin(range(local, .3, 1) * Math.PI);
    const from = turns[Math.max(0, turn - 1)], to = turns[turn];
    const amount = ease(range(local, .32, .9));
    const hp = (key, bar) => {
      const health = from[key] + (to[key] - from[key]) * amount;
      bar.style.transform = `scaleX(${health / 100})`;
      bar.parentElement.setAttribute('aria-valuenow', String(Math.round(health)));
    };
    hp('playerHP', playerHealth); hp('opponentHP', opponentHealth);
    root.style.setProperty('--motion', motion.toFixed(4));
    root.style.setProperty('--impact', impact.toFixed(4));
    root.style.setProperty('--beat-progress', local.toFixed(4));
    root.style.setProperty('--camera-x', `${quiet ? 0 : Math.sin(local * Math.PI * 8) * impact * 2}px`);
    root.dataset.turn = String(turn);
    root.dataset.effect = to.effect;
    beatButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(stage === 2 && i === turn)));
    marks.forEach((mark, i) => mark.classList.toggle('is-current', i === turn));
    if (turn !== lastTurn) {
      turnLabel.textContent = `${String(turn + 1).padStart(2, '0')} / ${to.title}`;
      turnCaption.textContent = to.caption;
      sound.textContent = to.sound;
      playerDamage.textContent = from.playerHP === to.playerHP ? '' : `−${from.playerHP - to.playerHP}`;
      opponentDamage.textContent = from.opponentHP === to.opponentHP ? '' : `−${from.opponentHP - to.opponentHP}`;
      lastTurn = turn;
    }
    root.style.setProperty('--result-reveal', ease(range(value, .90, 1)).toFixed(4));
  }
  function tick(time) {
    frame = 0;
    const dt = lastTime ? Math.min(48, time - lastTime) : 16;
    lastTime = time;
    if (dirty) { dirty = false; sync(); }
    displayed = reduced.matches || forced.matches ? target : displayed + (target - displayed) * (1 - Math.exp(-dt / 210));
    if (Math.abs(target - displayed) < .0002) displayed = target;
    paint(displayed);
    if (displayed !== target && !document.hidden) frame = requestAnimationFrame(tick);
    else lastTime = 0;
  }
  function schedule() {
    dirty = true;
    if (!frame && !document.hidden) frame = requestAnimationFrame(tick);
  }
  function bindControls(controls, choose) {
    controls.forEach((button, index) => {
      button.disabled = false;
      button.addEventListener('click', () => {
        // Finish native focus scrolling before recording the manual override position.
        scrollTo({ top: scrollY, behavior: 'instant' });
        choose(index);
      });
      button.addEventListener('keydown', event => {
        if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1
          : (index + (['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1) + controls.length) % controls.length;
        controls[next].scrollIntoView({ block: 'center', behavior: 'instant' });
        controls[next].focus({ preventScroll: true });
        choose(next);
      });
    });
  }
  bindControls(buttons, index => select(index, true));
  bindControls(beatButtons, index => select(2, true, beatTargets[index]));
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
