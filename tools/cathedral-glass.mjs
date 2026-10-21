// Derive every glass boundary from the canonical light field, not a second layout.
export function cathedralLightBands(css) {
  const field = css.match(/--cathedral-light-field:\s*linear-gradient\(90deg,([\s\S]*?)\);/)?.[1];
  const bands = [...(field || '').matchAll(/rgb\(var\(--light-([abc])\)\)\s+([\d.]+)%\s+([\d.]+)%/g)]
    .map(([, tone, start, end]) => ({tone, start: Number(start), end: Number(end)}));
  if (bands.length < 2 || bands[0].start !== 0 || bands.at(-1).end !== 100 ||
      bands.some((band, i) => band.end < band.start || (i && band.start < bands[i - 1].end))) {
    throw new Error('Cathedral glass requires an ordered, continuous light-field definition.');
  }
  return bands;
}

const number = value => Number(value.toFixed(3));
const point = value => value.map(number).join(',');
function curve(points, move = true) {
  let path = `${move ? 'M' : 'L'}${point(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const before = points[Math.max(0, i - 1)], from = points[i], to = points[i + 1], after = points[Math.min(points.length - 1, i + 2)];
    const a = from.map((value, axis) => value + (to[axis] - before[axis]) / 6);
    const b = to.map((value, axis) => value - (after[axis] - from[axis]) / 6);
    path += `C${point(a)} ${point(b)} ${point(to)}`;
  }
  return path;
}

export function renderCathedralGlass(css, name) {
  if (!/^[a-z][a-z-]*$/.test(name)) throw new Error('Invalid Cathedral glass namespace.');
  const bands = cathedralLightBands(css), id = `cathedral-glass-${name}`;
  const pairs = [...new Set(bands.map((band, i) => bands[(i + bands.length - 1) % bands.length].tone + band.tone))];
  // Neighboring colors are compressed into the bevel, suggesting local lensing.
  const refractions = pairs.map(pair => `<linearGradient id="${id}-${pair}"><stop offset="0" class="glass-tone-${pair[0]}" stop-opacity="0"/><stop offset=".22" class="glass-tone-${pair[1]}" stop-opacity=".72"/><stop offset=".48" class="glass-tone-${pair[0]}" stop-opacity=".92"/><stop offset=".7" class="glass-tone-c" stop-opacity=".82"/><stop offset="1" class="glass-tone-${pair[1]}" stop-opacity="0"/></linearGradient>`).join('');
  const sheens = [0.24, 0.49, 0.76].map((peak, i) => `<linearGradient id="${id}-sheen-${i}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="1000"><stop offset="0" stop-color="white" stop-opacity=".12"/><stop offset="${number(peak - .15)}" stop-color="white" stop-opacity=".28"/><stop offset="${peak}" stop-color="white" stop-opacity=".95"/><stop offset="${number(peak + .17)}" stop-color="white" stop-opacity=".23"/><stop offset="1" stop-color="white" stop-opacity=".1"/></linearGradient>`).join('');
  const rims = bands.map((band, index) => {
    const previous = bands[(index + bands.length - 1) % bands.length];
    const x = index ? (previous.end + band.start) * 5 : 0;
    const width = 1.7 + (Math.sin(index * 2.31) + 1) * .9;
    const points = [-32, 0, 180, 400, 620, 820, 1032].map((y, step) => {
      const bend = Math.sin(index * 1.7 + step * 1.31) * .8;
      const thickness = width * (.8 + .16 * Math.sin(index + step));
      return {left: [x + bend - thickness / 2, y], right: [x + bend + thickness / 2, y]};
    });
    const left = points.map(p => p.left), right = points.map(p => p.right);
    return `<g data-glass-edge="${number(x / 10)}"><path class="glass-lens" d="${curve(left)}${curve([...right].reverse(), false)}Z" fill="url(#${id}-${previous.tone}${band.tone})"/><path class="glass-edge-shadow" d="${curve(left)}" vector-effect="non-scaling-stroke"/><path class="glass-edge-highlight" d="${curve(right)}" stroke="url(#${id}-sheen-${index % 3})" vector-effect="non-scaling-stroke"/></g>`;
  }).join('');
  return `<svg class="cathedral-glass" viewBox="0 0 1000 1000" preserveAspectRatio="none" aria-hidden="true" focusable="false"><defs>${refractions}${sheens}<g id="${id}-tile">${rims}</g></defs><use href="#${id}-tile" x="-1000"/><use href="#${id}-tile"/><use href="#${id}-tile" x="1000"/></svg>`;
}
