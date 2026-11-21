import './scripts/game2-playtest-model.js';

const connections = document.querySelector('#connection-study');
const ac = connections.querySelector('[name="ac"]');
const usb = connections.querySelector('[name="usb"]');
const distance = connections.querySelector('[name="distance"]');
const connectionResult = connections.querySelector('output');

function renderConnections() {
  const span = distance.valueAsNumber;
  const canReach = span <= 2;
  const hasPicture = ac.checked && usb.checked && canReach;

  connections.querySelector('[data-distance]').textContent = span + ' m';
  connections.querySelector('[data-wire="ac"]').classList.toggle('on', ac.checked);
  connections.querySelector('[data-wire="power"]').classList.toggle('on', hasPicture);
  connections.querySelector('[data-wire="video"]').classList.toggle('on', hasPicture);

  if (!ac.checked) connectionResult.textContent = 'The monitor needs AC power.';
  else if (!usb.checked) connectionResult.textContent = 'The monitor has power. Connect USB-C for video.';
  else if (!canReach) connectionResult.textContent = 'The 2 m USB-C cable cannot reach the monitor.';
  else connectionResult.textContent = 'Picture on. Power and video reach their destinations.';
}

const route = document.querySelector('#route-editor');
const gap = route.querySelector('[name="gap"]');
const ledge = route.querySelector('[name="ledge"]');
const ledgeDrawing = route.querySelector('.route-ledge');
const groundDrawing = route.querySelector('.route-ground');
const cat = route.querySelector('.route-cat');
const jump = route.querySelector('[data-test-jump]');
const routeResult = route.querySelector('output');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const worldWidth = 480;
const gapStart = 136;
const floor = 74;
const jumpReach = 144;
const apex = 41;
const ledgeRise = 13;
const ledgeStart = gapStart + 107;
const ledgeWidth = 44;
let ground = [];
let flight;

function percentX(x) {
  return (x / worldWidth * 100) + '%';
}

function placeCat(x, y) {
  cat.style.left = percentX(x);
  cat.style.top = y + '%';
}

function cancelJump() {
  flight?.cancel();
  flight = undefined;
}

function renderRoute() {
  cancelJump();
  const gapWidth = gap.valueAsNumber;
  ground = globalThis.CATWALK_PLAYTEST_MODEL.createGroundSegments(worldWidth, [
    { x: gapStart + gapWidth / 2, width: gapWidth },
  ]);
  groundDrawing.replaceChildren(...ground.map(segment => {
    const block = document.createElement('i');
    block.style.left = percentX(segment.x - segment.width / 2);
    block.style.width = percentX(segment.width);
    return block;
  }));
  ledgeDrawing.hidden = !ledge.checked;
  route.querySelector('[data-gap]').textContent = gapWidth + ' px';
  placeCat(gapStart, floor);
  routeResult.textContent = '';
}

function testJump() {
  cancelJump();

  // Check the descending side of the arc at the ledge's height.
  const ledgeTime = (1 + Math.sqrt(1 - ledgeRise / apex)) / 2;
  const ledgeX = gapStart + jumpReach * ledgeTime;
  const landsOnLedge = ledge.checked && ledgeX >= ledgeStart && ledgeX <= ledgeStart + ledgeWidth;
  const floorX = gapStart + jumpReach;
  const landsOnFloor = ground.some(segment => Math.abs(floorX - segment.x) <= segment.width / 2);
  const falls = !landsOnLedge && !landsOnFloor;
  const endTime = landsOnLedge ? ledgeTime : 1;
  const endX = landsOnLedge ? ledgeX : floorX;
  const endY = landsOnLedge ? floor - ledgeRise : falls ? 101 : floor;

  function finish() {
    placeCat(endX, endY);
    if (landsOnLedge) routeResult.textContent = 'The ledge catches the landing.';
    else if (falls) routeResult.textContent = 'The gap is too wide. Try a ledge.';
    else routeResult.textContent = 'The cat clears the gap.';
  }

  if (reducedMotion.matches || typeof cat.animate !== 'function') {
    finish();
    return;
  }

  const frames = Array.from({ length: 21 }, (_, index) => {
    const t = endTime * index / 20;
    return {
      left: percentX(gapStart + jumpReach * t),
      top: (floor - 4 * apex * t * (1 - t)) + '%',
    };
  });
  if (falls) frames.push({ left: percentX(endX), top: endY + '%' });

  routeResult.textContent = 'Testing the jump…';
  const animation = cat.animate(frames, { duration: falls ? 750 : 650, easing: 'linear' });
  flight = animation;
  animation.onfinish = () => {
    if (flight !== animation) return;
    flight = undefined;
    finish();
  };
}

route.style.setProperty('--floor', floor + '%');
ledgeDrawing.style.left = percentX(ledgeStart);
ledgeDrawing.style.width = percentX(ledgeWidth);
ledgeDrawing.style.top = (floor - ledgeRise) + '%';

for (const [controls, render] of [[connections, renderConnections], [route, renderRoute]]) {
  render();
  controls.querySelector('fieldset').disabled = false;
  controls.addEventListener('input', render);
  window.addEventListener('pageshow', render);
}
jump.addEventListener('click', testJump);
