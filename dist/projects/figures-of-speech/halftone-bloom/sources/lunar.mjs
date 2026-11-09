export const meta = {
  title: 'Lunar',
  description: 'A crescent becomes a cratered moon. A shadow crosses its surface, then releases it.',
  duration: 11,
  posterTime: 4.3,
};

const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
const hash = (x, y, seed) => {
  let n = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 1442695041);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
};
const noise = (x, y, seed) => {
  const ix = Math.floor(x), iy = Math.floor(y), sx = smooth(0, 1, x - ix), sy = smooth(0, 1, y - iy);
  const a = hash(ix, iy, seed), b = hash(ix + 1, iy, seed), c = hash(ix, iy + 1, seed), d = hash(ix + 1, iy + 1, seed);
  return (a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy;
};
const fbm = (x, y, seed) => noise(x, y, seed) * .52 + noise(x * 2.07 + 7, y * 2.07, seed + 1) * .27
  + noise(x * 4.13, y * 4.13 + 13, seed + 2) * .14 + noise(x * 8.3 + 3, y * 8.3, seed + 3) * .07;

let cached;

function surface(ctx, width, height, seed) {
  if (cached?.width === width && cached?.height === height && cached?.seed === seed) return cached;
  const radius = Math.min(width, height) * .342;
  const centerX = width * .5, centerY = height * .49;
  const relief = new Float32Array(width * height);
  const albedo = new Float32Array(width * height);
  const nx = new Float32Array(width * height), ny = new Float32Array(width * height), nz = new Float32Array(width * height);
  const coverage = new Float32Array(width * height);
  const craters = [];
  for (let i = 0; i < 126; i++) {
    const angle = hash(i, 1, seed + 3) * Math.PI * 2;
    const spread = Math.sqrt(hash(i, 2, seed + 7)) * .96;
    const x = Math.cos(angle) * spread, y = Math.sin(angle) * spread;
    const r = .011 + Math.pow(hash(i, 3, seed + 9), 2.7) * .098;
    const z = Math.sqrt(1 - spread * spread);
    craters.push({ x, y, r, sy: r * (.34 + z * .66), depth: .7 + hash(i, 4, seed) * .6 });
  }
  // A few quiet large basins, with Tycho-like rays in the southern highlands.
  const maria = [
    [-.31, -.28, .35, .34, .50], [.10, -.36, .30, .20, .43], [.32, -.14, .26, .28, .32],
    [-.43, .13, .24, .25, .33], [-.12, .04, .24, .22, .28], [.36, .30, .15, .18, .17],
  ];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x, u = (x + .5 - centerX) / radius, v = (y + .5 - centerY) / radius;
      const r2 = u * u + v * v;
      if (r2 >= 1) continue;
      nx[i] = u; ny[i] = v; nz[i] = Math.sqrt(1 - r2);
      coverage[i] = clamp((1 - Math.sqrt(r2)) * radius);
      const broad = fbm(u * 5 + 11, v * 5 + 8, seed);
      const grain = fbm(u * 36 + 2, v * 36, seed + 17);
      let tone = .82 + (broad - .5) * .23 + (grain - .5) * .21;
      let h = (grain - .5) * .003;
      const warpedU = u + (noise(u * 12, v * 12, seed + 4) - .5) * .095;
      const warpedV = v + (noise(u * 12 + 7, v * 12, seed + 6) - .5) * .095;
      for (const [cx, cy, sx, sy, depth] of maria) {
        const d = ((warpedU - cx) / sx) ** 2 + ((warpedV - cy) / sy) ** 2;
        tone -= Math.exp(-d * d * .85) * depth;
      }
      for (const crater of craters) {
        const dx = (u - crater.x) / crater.r, dy = (v - crater.y) / crater.sy;
        if (Math.abs(dx) > 1.65 || Math.abs(dy) > 1.65) continue;
        const d = Math.hypot(dx, dy);
        if (d > 1.65) continue;
        const bowl = Math.exp(-d * d * 3.4);
        const rim = Math.exp(-(((d - 1) / .17) ** 2));
        h += crater.r * crater.depth * (-bowl * .105 + rim * .065);
        tone += rim * .12 - bowl * .045;
        if (crater.r > .06) h += Math.exp(-d * d * 85) * crater.r * .05;
      }
      const rayAngle = Math.atan2(v - .57, u + .22);
      const rayDistance = Math.hypot(u + .22, v - .57);
      const rays = Math.pow(Math.max(0, Math.sin(rayAngle * 23 + Math.sin(rayAngle * 7) * 2)), 16)
        * Math.exp(-rayDistance * 3.7) * smooth(.05, .15, rayDistance);
      tone += rays * .25;
      albedo[i] = clamp(tone, .18, .98);
      relief[i] = h;
    }
  }
  // Baking crater normals makes the relief react to the moving light rather than
  // remaining a flat photograph with a uniformly fading overlay.
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      if (!coverage[i]) continue;
      const dx = (relief[i + 1] - relief[i - 1]) * radius * .5;
      const dy = (relief[i + width] - relief[i - width]) * radius * .5;
      const xx = nx[i] - dx * 1.9, yy = ny[i] - dy * 1.9, zz = nz[i];
      const length = Math.hypot(xx, yy, zz);
      nx[i] = xx / length; ny[i] = yy / length; nz[i] = zz / length;
    }
  }
  const image = ctx.createImageData(width, height);
  for (let i = 3; i < image.data.length; i += 4) image.data[i] = 255;
  cached = { width, height, seed, radius, centerX, centerY, albedo, nx, ny, nz, coverage, image };
  return cached;
}

export function drawSource(ctx, time, { width = 640, height = 640, seed = 29 } = {}) {
  width = Math.round(width); height = Math.round(height);
  const moon = surface(ctx, width, height, seed);
  const t = clamp(time, 0, meta.duration);
  const waxing = smooth(.15, 4.2, t);
  const angle = 2.48 * (1 - waxing) - smooth(9, 11, t) * .22;
  const lightX = Math.sin(angle), lightY = -.18, lightZ = Math.cos(angle);
  const lightLength = Math.hypot(lightX, lightY, lightZ);
  const eclipseProgress = smooth(4.8, 8.7, t);
  const eclipsing = t > 4.8 && t < 8.7;
  const shadowX = moon.centerX + (1.93 - eclipseProgress * 3.86) * moon.radius;
  const shadowY = moon.centerY - moon.radius * .10;
  const shadowRadius = moon.radius * 1.035;
  const pixels = moon.image.data;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x, j = i * 4;
      let value = 0;
      if (moon.coverage[i]) {
        const light = (moon.nx[i] * lightX + moon.ny[i] * lightY + moon.nz[i] * lightZ) / lightLength;
        value = moon.albedo[i] * (.018 + Math.max(0, light) * 1.12);
        if (eclipsing) {
          const shadowDistance = Math.hypot(x + .5 - shadowX, y + .5 - shadowY);
          value *= smooth(shadowRadius - 1.8, shadowRadius + 1.8, shadowDistance);
        }
        value = Math.pow(clamp(value), .86) * moon.coverage[i] * 255;
      }
      pixels[j] = pixels[j + 1] = pixels[j + 2] = value;
    }
  }
  ctx.putImageData(moon.image, 0, 0);
}
