export const meta = {
  title: 'Shoal',
  description: 'Small fish find their places and become the silhouette of something larger.',
  duration: 10,
  posterTime: 10,
};

const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
const random = (index, seed) => {
  let n = Math.imul(index + 1, 374761393) ^ Math.imul(seed, 668265263);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const gray = value => { const v = Math.round(value); return `rgb(${v},${v},${v})`; };

const outline = [
  [-.235, 0], [-.19, -.062], [-.105, -.111], [-.058, -.126],
  [-.089, -.205], [-.002, -.169], [.076, -.135], [.151, -.104],
  [.223, -.057], [.266, -.018], [.282, 0], [.262, .027],
  [.206, .073], [.123, .108], [.041, .128], [.006, .182],
  [-.032, .126], [-.122, .101], [-.194, .057], [-.235, 0],
  [-.406, .17], [-.352, .004], [-.407, -.169],
];

function inside(x, y) {
  let contained = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const a = outline[i], b = outline[j];
    if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) contained = !contained;
  }
  // The giant fish's eye is a true hole in the school, rather than painted text.
  return contained && Math.hypot(x - .202, y + .019) > .034;
}

let lastSeed, lastSchool;
function schoolFor(seed) {
  if (lastSeed === seed) return lastSchool;
  const school = [];
  let index = 0;
  for (let row = 0; row < 18; row++) {
    const y = -.206 + row * .0245;
    for (let column = 0; column < 28; column++, index++) {
      const x = -.414 + column * .026 + (row % 2) * .013;
      const px = x + (random(index + 11, seed) - .5) * .016;
      const py = y + (random(index + 29, seed) - .5) * .016;
      if (!inside(px, py)) continue;
      const a = random(index + 91, seed) * Math.PI * 2;
      const radius = .31 + random(index + 101, seed) * .16;
      school.push({
        x: px + .548,
        y: py + .49,
        startX: .5 + Math.cos(a) * radius,
        startY: .5 + Math.sin(a) * radius * .79,
        bend: (random(index + 151, seed) - .5) * .30,
        delay: random(index + 171, seed) * 1.65,
        phase: random(index + 191, seed) * Math.PI * 2,
        length: .031 + random(index + 211, seed) * .015,
        brightness: 195 + random(index + 251, seed) * 60,
        index,
      });
    }
  }
  lastSeed = seed;
  lastSchool = school;
  return school;
}

function fish(ctx, length, tail, brightness, phase) {
  const bodyDepth = length * .27;
  const fin = length * .26;
  const shade = ctx.createLinearGradient(0, -bodyDepth, 0, bodyDepth);
  shade.addColorStop(0, gray(brightness * .65));
  shade.addColorStop(.34, gray(brightness));
  shade.addColorStop(.62, gray(brightness * .93));
  shade.addColorStop(1, gray(brightness * .64));
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(length * .5, 0);
  ctx.bezierCurveTo(length * .23, -bodyDepth * 1.28, -length * .19, -bodyDepth, -length * .36, tail * .25);
  ctx.bezierCurveTo(-length * .24, bodyDepth * .75, length * .21, bodyDepth * .9, length * .5, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-length * .31, tail * .2);
  ctx.quadraticCurveTo(-length * .49, -bodyDepth * .8 + tail * .6, -length * .68, -fin + tail);
  ctx.lineTo(-length * .57, tail);
  ctx.lineTo(-length * .68, fin + tail);
  ctx.quadraticCurveTo(-length * .48, bodyDepth * .7 + tail * .6, -length * .31, tail * .2);
  ctx.fillStyle = gray(brightness * .73);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-length * .08, -bodyDepth * .85);
  ctx.quadraticCurveTo(-length * .11, -bodyDepth * 1.88, length * .13, -bodyDepth * .9);
  ctx.fillStyle = gray(brightness * .69);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(length * .06, bodyDepth * .5);
  ctx.lineTo(-length * .09, bodyDepth * (1.4 + Math.sin(phase) * .12));
  ctx.lineTo(-length * .06, bodyDepth * .15);
  ctx.fillStyle = gray(brightness * .42);
  ctx.fill();
  ctx.strokeStyle = gray(brightness * .78);
  ctx.lineWidth = .00055;
  ctx.beginPath();
  ctx.moveTo(-length * .21, -.0005);
  ctx.quadraticCurveTo(0, -bodyDepth * .22, length * .28, -bodyDepth * .05);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(length * .323, -bodyDepth * .17, Math.max(.0008, length * .042), 0, Math.PI * 2);
  ctx.fillStyle = '#121212';
  ctx.fill();
}

export function drawSource(ctx, time, { width = 640, height = 640, seed = 29 } = {}) {
  const seconds = Math.max(0, Math.min(meta.duration, time));
  const school = schoolFor(seed);
  const settled = seconds >= 9;
  const fadeMotion = 1 - smooth((seconds - 6.7) / 2.3);
  ctx.save();
  ctx.scale(width, height);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 1, 1);
  for (const member of school) {
    const p = smooth((seconds - .5 - member.delay) / 6.3);
    const q = 1 - p;
    // A curved approach keeps each fish's orientation tied to actual movement.
    const dx = member.x - member.startX, dy = member.y - member.startY;
    const distance = Math.hypot(dx, dy) || 1;
    const bx = -dy / distance * member.bend, by = dx / distance * member.bend;
    const along = Math.sin(p * Math.PI);
    const drift = Math.sin(seconds * 2.4 + member.phase) * .005 * fadeMotion;
    const x = member.startX * q + member.x * p + bx * along;
    const y = member.startY * q + member.y * p + by * along + drift;
    const tangentX = dx + bx * Math.PI * Math.cos(p * Math.PI);
    const tangentY = dy + by * Math.PI * Math.cos(p * Math.PI);
    const swimAngle = Math.atan2(tangentY, tangentX);
    const targetAngle = Math.sin(member.x * 6.5 + member.y * 4) * .22 + Math.sin(member.phase) * .10;
    let difference = targetAngle - swimAngle;
    difference = Math.atan2(Math.sin(difference), Math.cos(difference));
    const orient = swimAngle + difference * smooth((p - .56) / .44);
    const tail = settled ? 0 : Math.sin(seconds * (9 + member.index % 4) + member.phase) * member.length * .13 * fadeMotion;
    const frontLight = .90 + .10 * Math.sin(member.x * 7 - member.y * 3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(orient);
    fish(ctx, member.length, tail, member.brightness * frontLight, member.phase + seconds * 5 * fadeMotion);
    ctx.restore();
  }
  // A clean eye survives the larger individual fish at the settled endpoint.
  const eye = smooth((seconds - 6.5) / 2);
  if (eye > 0) {
    ctx.beginPath();
    ctx.arc(.75, .471, .019 * eye, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
  }
  ctx.restore();
}

export function schoolSize(seed = 29) { return schoolFor(seed).length; }
