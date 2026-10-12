// Real world-space positions: x/z describe a circle; y advances along its axis.
// Both views use the same photographs and the same perspective camera.
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const sizes = [.98, .77, .91, 1.12, .81, 1.02, .88, .76, 1.06, .83];
const rolls = [-3.2, 2.1, -.8, 3.5, -2.4, 1.6, -1.2, 2.8, -.6, -2];

export function spiralMetrics(width, height, count) {
  const scale = Math.min(1, width / 1300);
  const radius = Math.min(420, width * .295);
  const step = clamp(height * .095, 62, 108);
  const start = Math.min(step * 3.4, Math.max(step * .65, (height / 2 - 160) * 1.1));
  const end = Math.max(start, (count - 1) * step - Math.min(step * 1.5, height * .15));
  return { radius, step, start, end, printWidth: clamp(290 * scale, 125, 290),
    distance: Math.max(height, (end - start) * 2.6), perspective: width > 1600 ? 1800 : width <= 760 ? 1000 : 1500 };
}

export function spiralPose(index, progress, width, height, count, reducedMotion = false) {
  const m = spiralMetrics(width, height, count);
  const angle = -2.05 + index * .9 + (reducedMotion ? 0 : progress * .32);
  return { x: Math.cos(angle) * m.radius,
    y: index * m.step + Math.sin(index * 2.3) * m.step * .12 - (m.start + progress * (m.end - m.start)),
    z: Math.sin(angle) * m.radius * .70,
    rx: Math.sin(angle) * 4, ry: Math.cos(angle) * -23, rz: rolls[index % rolls.length],
    width: m.printWidth * sizes[index % sizes.length] };
}

export function galleryLayout(width, height, photos) {
  const margin = width <= 760 ? 24 : Math.max(50, width * .075);
  const available = Math.min(1200, width - margin * 2);
  const left = (width - available) / 2;
  const narrow = width < 650;
  const items = [];
  let top = width <= 760 ? 165 : 185;
  let index = 0, row = 0;
  while (index < photos.length) {
    const pattern = narrow
      ? [[[.42, .80, 0]], [[.60, .68, 0]], [[.45, .88, 0]]][row % 3]
      : row % 3 === 0 ? [[.17, .30, 30], [.55, .23, 170], [.87, .23, 0]]
      : row % 3 === 1 ? [[.29, .43, 0], [.82, .28, 145]]
      : [[.13, .22, 95], [.51, .28, 0], [.86, .25, 140]];
    let bottom = top;
    for (const [center, fraction, offset] of pattern) {
      if (index >= photos.length) break;
      const photo = photos[index];
      const w = available * fraction;
      const h = w * photo.height / photo.width;
      const y = top + offset + h / 2;
      items.push({ x: left + available * center - width / 2, y, z: 0, rx: 0, ry: 0, rz: 0, width: w });
      bottom = Math.max(bottom, top + offset + h + 42);
      index++;
    }
    top = bottom + (narrow ? 65 : 135);
    row++;
  }
  return { items, height: Math.max(height + 1, top + 90) };
}

export function interpolatePose(from, to, amount) {
  return Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}
