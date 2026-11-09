export const meta = {
  title: 'Tide',
  description: 'A swell rises into a curling crest, breaks into spray, and returns to the sea.',
  duration: 11,
  posterTime: 5.2,
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (i, channel, seed) => {
  let n = Math.imul(i + 1, 374761393) ^ Math.imul(channel + 1, 668265263) ^ Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const gray = value => `rgb(${Math.round(value)},${Math.round(value)},${Math.round(value)})`;
const cubic = (a, b, c, d, t) => { const s = 1 - t; return s * s * s * a + 3 * s * s * t * b + 3 * s * t * t * c + t * t * t * d; };

export function drawSource(ctx, time, { width = 640, height = 640, seed = 29 } = {}) {
  const t = clamp(time, 0, meta.duration);
  const rise = smooth(.1, 4.2, t), breaking = smooth(4.7, 8.5, t), resting = smooth(8.4, 11, t);
  const amplitude = .34 + rise * .66 - breaking * .13 - resting * .12;
  const drift = Math.sin(t * .4) * .012 * (1 - resting);
  const X = x => (x + drift) * width;
  const Y = y => (.81 + (y - .81) * amplitude) * height;
  const move = (x, y) => ctx.moveTo(X(x), Y(y));
  const curve = (a, b, c, d, e, f) => ctx.bezierCurveTo(X(a), Y(b), X(c), Y(d), X(e), Y(f));
  ctx.save();
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  // Low, distant swells establish the plane underneath the single large crest.
  for (let i = 0; i < 24; i++) {
    const y = .72 + i * .0065;
    const swell = Math.sin(t * .8 + i * .31) * .008 * (1 - resting);
    ctx.beginPath();
    move(.07, y + swell);
    curve(.20, y - .016, .24, y + .017, .39, y);
    curve(.57, y - .012, .72, y + .018, .93, y - .007);
    ctx.strokeStyle = gray(24 + (i % 4) * 13);
    ctx.lineWidth = Math.min(width, height) * .0015;
    ctx.stroke();
  }

  ctx.beginPath();
  move(.07, .80);
  curve(.23, .77, .23, .59, .38, .39);
  curve(.51, .20, .68, .18, .76, .31);
  curve(.86, .47, .75, .61, .63, .57);
  curve(.55, .55, .54, .47, .59, .43);
  curve(.63, .40, .68, .42, .69, .46);
  curve(.67, .42, .64, .44, .64, .47);
  curve(.64, .52, .72, .53, .75, .47);
  curve(.83, .34, .68, .25, .59, .32);
  curve(.50, .39, .54, .57, .62, .65);
  curve(.73, .79, .85, .75, .93, .80);
  curve(.87, .88, .18, .91, .07, .86);
  ctx.closePath();
  const water = ctx.createLinearGradient(X(.24), Y(.84), X(.64), Y(.24));
  water.addColorStop(0, '#161616');
  water.addColorStop(.24, '#484848');
  water.addColorStop(.48, '#242424');
  water.addColorStop(.74, '#858585');
  water.addColorStop(.94, '#d8d8d8');
  water.addColorStop(1, '#f2f2f2');
  ctx.fillStyle = water;
  ctx.fill();
  ctx.save();
  ctx.clip();

  // Unequal engraved ribbons describe water moving up the face and around the
  // curl. Their varying width and brightness survive the later square dither.
  for (let i = 0; i < 67; i++) {
    const s = i / 66, jitter = (hash(i, 1, seed) - .5) * .013;
    ctx.beginPath();
    move(.075 + s * .43, .86 - s * .045);
    curve(.22 + s * .25, .77 - s * .08, .23 + s * .23, .56 - s * .12, .38 + s * .14, .39 - s * .06);
    curve(.48 + s * .10, .23 + s * .02 + jitter, .67 - s * .04, .19 + s * .08, .75 - s * .025, .31 + s * .035);
    curve(.85 - s * .055, .47, .75 - s * .04, .61 - s * .04, .63, .57 - s * .045);
    ctx.strokeStyle = gray(35 + hash(i, 2, seed) * 110 + (i % 7 === 0 ? 35 : 0));
    ctx.lineWidth = width * (.0011 + hash(i, 3, seed) * .0028);
    ctx.stroke();
  }
  for (let i = 0; i < 34; i++) {
    const s = i / 33;
    ctx.beginPath();
    move(.13, .88 - s * .085);
    curve(.35, .91 - s * .16, .46, .80 - s * .23, .48 + s * .026, .54 - s * .11);
    ctx.strokeStyle = gray(35 + hash(i, 4, seed) * 90);
    ctx.lineWidth = width * (.001 + hash(i, 5, seed) * .002);
    ctx.stroke();
  }
  // The inside of the lip has its own close-set contour lines and deep hollow.
  for (let i = 0; i < 19; i++) {
    const s = i / 18;
    ctx.beginPath();
    move(.59 - s * .025, .32 + s * .018);
    curve(.68 + s * .018, .25 + s * .018, .83 - s * .03, .34 + s * .022, .75 - s * .018, .47 + s * .015);
    ctx.strokeStyle = gray(90 + hash(i, 7, seed) * 100);
    ctx.lineWidth = width * (.0012 + hash(i, 8, seed) * .0012);
    ctx.stroke();
  }
  ctx.restore();

  // A broken foamy crest follows three real curve segments rather than a white
  // outline. Fingers branch away from it, then shed a finite ballistic spray.
  const crest = [
    [[.34, .45], [.45, .25], [.64, .16], [.75, .29]],
    [[.75, .29], [.85, .41], [.80, .54], [.70, .57]],
    [[.70, .57], [.61, .60], [.55, .53], [.58, .47]],
  ];
  for (let segment = 0; segment < crest.length; segment++) {
    const p = crest[segment];
    for (let i = 0; i < 64; i++) {
      const index = segment * 64 + i, u = i / 63;
      const x = cubic(p[0][0], p[1][0], p[2][0], p[3][0], u);
      const y = cubic(p[0][1], p[1][1], p[2][1], p[3][1], u);
      const after = Math.min(1, u + .012), before = Math.max(0, u - .012);
      const dx = cubic(p[0][0], p[1][0], p[2][0], p[3][0], after) - cubic(p[0][0], p[1][0], p[2][0], p[3][0], before);
      const dy = cubic(p[0][1], p[1][1], p[2][1], p[3][1], after) - cubic(p[0][1], p[1][1], p[2][1], p[3][1], before);
      const length = Math.hypot(dx, dy) || 1;
      const normalX = dy / length, normalY = -dx / length;
      const lengthen = (.007 + hash(index, 11, seed) * .035) * (.55 + rise * .45);
      const loose = Math.sin(index * 2.3 + t * 2) * .0025 * (1 - resting);
      const branchX = x + normalX * lengthen + loose;
      const branchY = y + normalY * lengthen;
      ctx.beginPath();
      move(x - normalX * .005, y - normalY * .005);
      ctx.quadraticCurveTo(X(x + normalX * lengthen * .7 + .006), Y(y + normalY * lengthen * .4), X(branchX), Y(branchY));
      ctx.strokeStyle = gray(165 + hash(index, 12, seed) * 90);
      ctx.lineWidth = width * (.0022 + hash(index, 13, seed) * .0048);
      ctx.lineCap = 'round';
      ctx.stroke();
      if (index % 3 === 0) {
        ctx.fillStyle = gray(195 + hash(index, 14, seed) * 60);
        ctx.beginPath();
        ctx.ellipse(X(branchX), Y(branchY), width * .003, height * .002, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.lineCap = 'butt';

  for (let i = 0; i < 205; i++) {
    const age = t - (3.7 + hash(i, 20, seed) * 2.5);
    if (age <= 0 || age >= 3.4) continue;
    const originX = .56 + hash(i, 21, seed) * .20;
    const originY = .26 + hash(i, 22, seed) * .075;
    const vx = (hash(i, 23, seed) - .28) * .09;
    const vy = -.065 - hash(i, 24, seed) * .12;
    const x = originX + vx * age;
    const y = originY + vy * age + .053 * age * age;
    if (x < .075 || x > .925 || Y(y) < height * .10 || Y(y) > height * .86) continue;
    const size = width * (.0013 + hash(i, 25, seed) * .0032) * (1 - smooth(2.3, 3.4, age) * .6);
    ctx.fillStyle = gray(160 + hash(i, 26, seed) * 95);
    ctx.fillRect(X(x), Y(y), size, size);
  }

  // Broken whitewater spreads along the foot as the airborne spray returns.
  for (let i = 0; i < 94; i++) {
    const x = .12 + i / 93 * .79;
    const y = .80 + Math.sin(i * .59 + t * .9 * (1 - resting)) * .012 + hash(i, 30, seed) * .027;
    const extent = .007 + hash(i, 31, seed) * .027;
    ctx.beginPath();
    move(x, y);
    curve(x + extent * .3, y - .007, x + extent * .7, y - .006, x + extent, y - .001);
    ctx.strokeStyle = gray(65 + hash(i, 32, seed) * (70 + breaking * 110));
    ctx.lineWidth = width * (.001 + hash(i, 33, seed) * .003);
    ctx.stroke();
  }
  ctx.restore();
}
