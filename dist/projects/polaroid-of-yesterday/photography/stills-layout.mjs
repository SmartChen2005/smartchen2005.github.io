// Real world-space positions: x/z describe a circle; y advances along its axis.
// Both views use the same photographs and the same perspective camera.
export const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const sizes = [.98, .77, .91, 1.12, .81, 1.02, .88, .76, 1.06, .83];

export function spiralMetrics(width, height, count) {
  const scale = Math.min(1, width / 1300);
  const radius = Math.min(420, width * .295);
  const step = clamp(height * .095, 62, 108);
  const start = height < 500 ? step * .65 : Math.min(step * 2.1, Math.max(0, (height / 2 - 250) * 1.1));
  const end = Math.max(start, (count - 1) * step - Math.min(step * 1.5, height * .15));
  return { radius, step, start, end, printWidth: clamp(290 * scale, 125, 290),
    distance: Math.max(height, (end - start) * 2.6), perspective: width > 1600 ? 1800 : width <= 760 ? 1000 : 1500 };
}

export function spiralPose(index, progress, width, height, count) {
  const m = spiralMetrics(width, height, count);
  const angle = -2.05 + index * .9;
  return { x: Math.cos(angle) * m.radius,
    y: index * m.step + Math.sin(index * 2.3) * m.step * .12 - (m.start + progress * (m.end - m.start)),
    z: Math.sin(angle) * m.radius * .70,
    rx: Math.sin(angle) * 4, ry: Math.cos(angle) * -23, rz: 0,
    width: m.printWidth * sizes[index % sizes.length] };
}

export function galleryLayout(width, height, photos, viewportWidth = width) {
  const margin = width <= 700 ? 18 : clamp(width * .03, 24, 48);
  const columns = viewportWidth >= 1440 ? 4 : viewportWidth >= 1024 ? 3 : 2;
  const gap = width <= 700 ? 16 : 24;
  const printWidth = (width - margin * 2 - gap * (columns - 1)) / columns;
  const slotHeight = printWidth * 4 / 3;
  const rowGap = width <= 700 ? 32 : 44;
  // The mobile Gallery/Polaroid breadcrumb occupies a second navigation row.
  const top = height < 500 ? 100 : width <= 700 ? 240 : 230;
  const items = [];
  let rowTop = top;
  for (let index = 0; index < photos.length; index++) {
    const column = index % columns, row = Math.floor(index / columns);
    if (column === 0 && row > 0) {
      const previous = photos.slice(index - columns, index);
      const captionSpace = Math.max(64, ...previous.map(photo =>
        10 + (Math.ceil((photo.title || '').length * 8 / printWidth) + Math.ceil((photo.kind || '').length * 8 / printWidth)) * 18));
      rowTop += slotHeight + captionSpace + rowGap;
    }
    items.push({ x: margin + column * (printWidth + gap) + printWidth / 2 - width / 2,
      y: rowTop + slotHeight / 2,
      z: 0, rx: 0, ry: 0, rz: 0, width: printWidth });
  }
  const lastRow = photos.slice(Math.floor(Math.max(0, photos.length - 1) / columns) * columns);
  const finalCaption = Math.max(64, ...lastRow.map(photo =>
    10 + (Math.ceil((photo.title || '').length * 8 / printWidth) + Math.ceil((photo.kind || '').length * 8 / printWidth)) * 18));
  return { items, columns, slotHeight, height: Math.max(height + 1, rowTop + slotHeight + finalCaption + rowGap + 60) };
}

export function interpolatePose(from, to, amount) {
  return Object.fromEntries(Object.keys(to).map(key => [key, from[key] + (to[key] - from[key]) * amount]));
}
