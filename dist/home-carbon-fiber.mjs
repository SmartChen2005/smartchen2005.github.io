// A fixed two-over/two-under weave. The tool-scale surface never follows the
// pointer: only the studio light moves over its curved bundles and filaments.
export const CARBON_PERIOD = 72;
const CARBON_SAMPLE = 192;
const carbonWrap = value => (value % 4 + 4) % 4;

export function carbonSurface(size = CARBON_SAMPLE) {
  const surface = new Float32Array(size * size * 5);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const u = x / size * 4, v = y / size * 4;
    const column = Math.floor(u), row = Math.floor(v);
    const horizontal = carbonWrap(column - row) < 2;
    const across = horizontal ? v - row : u - column;
    const along = (horizontal ? carbonWrap(u - row) : carbonWrap(v - column - 1)) / 2;
    const arch = Math.sin(across * Math.PI);
    const bend = Math.sin(along * Math.PI);
    // Slight filament waviness and pressure variation, not a printed grid.
    const strand = (across * 21 + .12 * Math.sin(along * Math.PI * 2) + .06 * Math.sin(along * Math.PI * 7)) * Math.PI * 2;
    const fiber = .5 + .5 * Math.cos(strand);
    const noise = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    const micro = noise - Math.floor(noise);
    const shortNormal = Math.cos(across * Math.PI) * .3 + Math.sin(strand) * .045;
    const longNormal = Math.cos(along * Math.PI) * .13;
    const i = (y * size + x) * 5;
    surface[i] = (4.5 + arch * 5 + fiber * 2.5 + micro * 1.7) * (.68 + bend * .32);
    surface[i + 1] = horizontal ? longNormal : shortNormal;
    surface[i + 2] = horizontal ? shortNormal : longNormal;
    surface[i + 3] = Math.sqrt(1 - shortNormal ** 2 - longNormal ** 2);
    surface[i + 4] = (.5 + fiber * .5) * (.6 + bend * .4);
  }
  return surface;
}

export function carbonReflection(surface, light) {
  const hx = (light.x - .5) * .58, hy = (light.y - .5) * .58;
  const length = Math.hypot(hx, hy, 1);
  const pixels = new Uint8ClampedArray(surface.length / 5 * 4);
  for (let i = 0, p = 0; i < surface.length; i += 5, p += 4) {
    const direction = (surface[i + 1] * hx + surface[i + 2] * hy + surface[i + 3]) / length;
    const sheen = Math.max(0, direction) ** 58 * surface[i + 4];
    pixels[p] = pixels[p + 1] = pixels[p + 2] = 255;
    pixels[p + 3] = Math.round(sheen * 45);
  }
  return pixels;
}

export function createCarbonFiber(context) {
  // Retain the black CSS backing when a canvas context is unavailable.
  if (!context || !document.createElement) return { draw() {} };
  const tile = document.createElement('canvas'), glint = document.createElement('canvas');
  const coat = document.createElement('canvas');
  tile.width = tile.height = glint.width = glint.height = CARBON_SAMPLE;
  const base = tile.getContext('2d'), shine = glint.getContext('2d'), resin = coat.getContext('2d');
  if (!base || !shine || !resin) return { draw() {} };
  const surface = carbonSurface();
  const image = base.createImageData(CARBON_SAMPLE, CARBON_SAMPLE);
  for (let i = 0, p = 0; i < surface.length; i += 5, p += 4) {
    image.data[p] = image.data[p + 1] = image.data[p + 2] = Math.round(surface[i]);
    image.data[p + 3] = 255;
  }
  base.putImageData(image, 0, 0);
  const backing = context.createPattern(tile, 'repeat');
  const reflection = shine.createImageData(CARBON_SAMPLE, CARBON_SAMPLE);
  let lastX = -1, lastY = -1, pattern = null;
  const scale = CARBON_PERIOD / CARBON_SAMPLE;

  function fill(target, texture, w, h) {
    target.save(); target.scale(scale, scale);
    target.fillStyle = texture; target.fillRect(0, 0, w / scale, h / scale);
    target.restore();
  }
  return { draw(w, h, light, ratio = 1) {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return;
    fill(context, backing, w, h);
    const x = Math.round(light.x * 300) / 300, y = Math.round(light.y * 300) / 300;
    if (x !== lastX || y !== lastY || coat.width !== Math.round(w * ratio) || coat.height !== Math.round(h * ratio)) {
      lastX = x; lastY = y;
      reflection.data.set(carbonReflection(surface, { x, y }));
      shine.putImageData(reflection, 0, 0);
      pattern = resin.createPattern(glint, 'repeat');
      if (coat.width !== Math.round(w * ratio) || coat.height !== Math.round(h * ratio)) {
        coat.width = Math.round(w * ratio); coat.height = Math.round(h * ratio);
        resin.setTransform(ratio, 0, 0, ratio, 0, 0);
      } else resin.clearRect(0, 0, w, h);
      fill(resin, pattern, w, h);
      const cx = x * w, cy = y * h, radius = Math.max(w * .28, h * .42);
      const mask = resin.createRadialGradient(cx, cy, 0, cx, cy, radius);
      mask.addColorStop(0, '#ffffff'); mask.addColorStop(.22, '#ffffffbd'); mask.addColorStop(1, '#ffffff00');
      resin.globalCompositeOperation = 'destination-in';
      resin.fillStyle = mask; resin.fillRect(0, 0, w, h);
      resin.globalCompositeOperation = 'source-over';
      // A broader, weaker clear-coat response shares the same source.
      const clearCoat = resin.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2);
      clearCoat.addColorStop(0, '#ffffff07'); clearCoat.addColorStop(.4, '#ffffff02'); clearCoat.addColorStop(1, '#ffffff00');
      resin.fillStyle = clearCoat; resin.fillRect(0, 0, w, h);
    }
    context.drawImage(coat, 0, 0, w, h);
  } };
}
