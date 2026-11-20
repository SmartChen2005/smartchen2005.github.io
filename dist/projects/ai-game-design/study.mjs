import './scripts/game2-playtest-model.js';

const power = document.querySelector('#power-lab');
const powerNodes = [...power.querySelectorAll('[data-powered]')];
const powerWires = [...power.querySelectorAll('[data-wire]')];
const powerInputs = [...power.querySelectorAll('input')];
const list = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });

function renderPower() {
  let energized = true;
  powerNodes[0].classList.add('on');
  powerInputs.forEach((input, index) => {
    energized = energized && input.checked;
    powerNodes[index + 1].classList.toggle('on', energized);
    powerWires[index].classList.toggle('on', energized);
  });
  const reached = powerNodes.slice(1).filter(node => node.classList.contains('on'));
  power.querySelector('output').textContent = reached.length
    ? `The outlet reaches ${list.format(reached.map(node => node.textContent))}.`
    : 'Only the outlet is powered.';
}

const route = document.querySelector('#route-lab');
const routeInputs = [...route.querySelectorAll('input')];
const routeTrack = route.querySelector('.route-track');
const worldWidth = 100;
const gaps = [[20, 46], [38, 62], [73, 87]].map(([start, end]) => ({
  x: (start + end) / 2,
  width: end - start,
}));

function renderRoute() {
  const activeGaps = gaps.filter((_, index) => routeInputs[index].checked);
  const ground = globalThis.CATWALK_PLAYTEST_MODEL.createGroundSegments(worldWidth, activeGaps);
  const intervals = ground.map(segment => [segment.x - segment.width / 2, segment.x + segment.width / 2]);
  routeTrack.replaceChildren(...intervals.map(([start, end]) => {
    const segment = document.createElement('i');
    segment.style.setProperty('--start', `${start}%`);
    segment.style.setProperty('--span', `${end - start}%`);
    return segment;
  }));
  route.querySelector('output').textContent = `Solid ground: ${intervals.map(([start, end]) => `[${start}, ${end}]`).join(', ')}.`;
}

const echo = document.querySelector('#echo-lab');
const traits = {
  vigilance: ['Vigilance', 'False Wukong marks a distant attacker when hit from range.'],
  killing: ['Killing Intent', 'False Wukong turns toward the weakest enemy.'],
};

function renderEcho() {
  const chosen = echo.querySelector('input:checked').value;
  const discarded = Object.keys(traits).find(trait => trait !== chosen);
  echo.querySelector('#kept-trait').textContent = traits[chosen][0];
  echo.querySelector('#echoed-trait').textContent = traits[discarded][0];
  echo.querySelector('output').textContent = traits[discarded][1];
}

const sketches = [[power, renderPower], [route, renderRoute], [echo, renderEcho]];
for (const [controls, render] of sketches) {
  render();
  controls.querySelector('fieldset').disabled = false;
  controls.addEventListener('change', render);
}
window.addEventListener('pageshow', () => sketches.forEach(([, render]) => render()));
